const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the start and end of the shake listener
const startShake = html.indexOf("window.addEventListener('devicemotion', function(event) {");
const endShake = html.indexOf("});", startShake) + 3;

if (startShake !== -1 && endShake !== -1) {
    const newShakeLogic = `
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    if (force > 35 && (now - lastShake) > 2000) {
      lastShake = now;
      
      // 1. PRIORITIZE SHAKE TO UNDO
      if (window.enableShakeToUndo) {
          // Find the last message sent by YOU on the screen
          const myMessages = document.querySelectorAll('#chat-messages .msg.sent');
          
          if (myMessages.length > 0) {
              const lastMsg = myMessages[myMessages.length - 1];
              const msgId = lastMsg.id.replace('msg-', '');
              const chatId = activeChatId;
              
              if (msgId && chatId) {
                  // Animate out
                  lastMsg.style.transition = 'opacity 0.3s, transform 0.3s';
                  lastMsg.style.opacity = '0';
                  lastMsg.style.transform = 'scale(0.5)';
                  setTimeout(() => lastMsg.remove(), 300);
                  
                  // Remove from LocalStorage
                  let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + chatId)) || [];
                  msgs = msgs.filter(m => m.msgId !== msgId);
                  localStorage.setItem('bapp_msgs_' + chatId, JSON.stringify(msgs));
                  
                  // Update Chat List
                  if (typeof loadChatList === 'function') loadChatList();
                  
                  // Send Ghost Delete to Server
                  if (socket.readyState === WebSocket.OPEN) {
                      socket.send(JSON.stringify({ type: 'ghost_delete', to: chatId, from: myBappId, msgId: msgId }));
                  }
                  
                  // Feedback
                  if (typeof showToast === 'function') showToast("Message Undone! 🫢");
                  else alert("Message Undone!");
                  
                  return; // Stop so calculator doesn't open
              }
          } else {
              if (typeof showToast === 'function') showToast("No messages to undo in this chat");
              else alert("No messages to undo in this chat");
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
    
    // 2. Remove the old debug alerts from the previous patch
    html = html.replace('alert("Shake detected! Tracker says: " + JSON.stringify(window.lastSentMessage));', '');
    
    fs.writeFileSync('index.html', html);
    console.log('✅ Undo logic now scans the DOM for the last sent message!');
} else {
    console.log('❌ Could not find the shake listener block.');
}
