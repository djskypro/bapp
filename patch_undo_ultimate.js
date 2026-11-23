const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Save the last sent message in sendMessage (we use a regex to ensure it hits the right one)
const oldSend = `const msgId = Date.now().toString();`;
const newSend = `const msgId = Date.now().toString();
    
    // SAVE LAST SENT MESSAGE FOR UNDO
    localStorage.setItem('bapp_last_sent', JSON.stringify({ to: activeChatId, msgId: msgId, time: Date.now() }));`;

// Replace only the first occurrence inside sendMessage
const sendStart = html.indexOf('function sendMessage() {');
const sendEnd = html.indexOf('const isConnected', sendStart);
let sendBlock = html.substring(sendStart, sendEnd);
sendBlock = sendBlock.replace(oldSend, newSend);
html = html.substring(0, sendStart) + sendBlock + html.substring(sendEnd);

// 2. Rewrite the Shake Listener
const startShake = html.indexOf("window.addEventListener('devicemotion', function(event) {");
const endShake = html.indexOf("});", startShake) + 3;

if (startShake !== -1 && endShake !== -1) {
    const newShakeLogic = `
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    // Lowered threshold to 20 so it's easier to trigger
    if (force > 20 && (now - lastShake) > 1500) {
      lastShake = now;
      
      // 1. PRIORITIZE SHAKE TO UNDO
      if (window.enableShakeToUndo) {
          const lastData = JSON.parse(localStorage.getItem('bapp_last_sent'));
          
          if (lastData && lastData.msgId) {
              // 1. Send Ghost Delete to Server
              if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type: 'ghost_delete', to: lastData.to, from: myBappId, msgId: lastData.msgId }));
              }
              
              // 2. Remove from LocalStorage chat history
              let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + lastData.to)) || [];
              msgs = msgs.filter(m => m.msgId !== lastData.msgId);
              localStorage.setItem('bapp_msgs_' + lastData.to, JSON.stringify(msgs));
              
              // 3. Remove from screen if we are currently in that chat
              const el = document.getElementById('msg-' + lastData.msgId);
              if (el) {
                  el.style.transition = 'opacity 0.3s, transform 0.3s';
                  el.style.opacity = '0';
                  el.style.transform = 'scale(0.5)';
                  setTimeout(() => el.remove(), 300);
              }
              
              // 4. Update Chat List
              if (typeof loadChatList === 'function') loadChatList();
              
              // 5. Clear the tracker so you can't undo twice
              localStorage.removeItem('bapp_last_sent');
              
              // 6. Feedback
              if (typeof showToast === 'function') showToast("Message Undone! 🫢");
              else alert("Message Undone!");
              
              return; 
          } else {
              if (typeof showToast === 'function') showToast("No recent message to undo");
              else alert("No recent message to undo");
              return;
          }
      }
      
      // 2. FALLBACK TO PANIC MODE
      if (window.enablePanicMode) {
          document.getElementById('fake-calculator').style.display = 'flex';
      }
    }
  });
`;
    html = html.substring(0, startShake) + newShakeLogic + html.substring(endShake);
    
    // 3. Remove the old debug alert
    html = html.replace('alert("Shake detected! Tracker says: " + JSON.stringify(window.lastSentMessage));', '');
    
    fs.writeFileSync('index.html', html);
    console.log('✅ Ultimate Undo logic applied! Works from anywhere.');
} else {
    console.log('❌ Could not find the shake listener block.');
}
