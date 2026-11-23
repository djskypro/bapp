const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the start and end of the old devicemotion listener
const startShake = html.indexOf("window.addEventListener('devicemotion', function(event) {");
const endShake = html.indexOf("});", startShake) + 3;

if (startShake !== -1 && endShake !== -1) {
    const newShakeLogic = `
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    // Trigger if shaken hard enough (force > 35) and not triggered in last 2 seconds
    if (force > 35 && (now - lastShake) > 2000) {
      lastShake = now;
      
      // 1. PRIORITIZE SHAKE TO UNDO IF TURNED ON
      if (window.enableShakeToUndo) {
          if (window.lastSentMessage && window.lastSentMessage.msgId) {
              const msgToDelete = window.lastSentMessage;
              
              // Remove from DOM
              const el = document.getElementById('msg-' + msgToDelete.msgId);
              if(el) {
                  el.style.transition = 'opacity 0.3s, transform 0.3s';
                  el.style.opacity = '0';
                  el.style.transform = 'scale(0.5)';
                  setTimeout(() => el.remove(), 300);
              }
              
              // Remove from LocalStorage
              let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msgToDelete.to)) || [];
              msgs = msgs.filter(m => m.msgId !== msgToDelete.msgId);
              localStorage.setItem('bapp_msgs_' + msgToDelete.to, JSON.stringify(msgs));
              
              // Remove from Chat List Preview
              if (typeof loadChatList === 'function') loadChatList();
              
              // Send Ghost Delete to Server
              if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type: 'ghost_delete', to: msgToDelete.to, from: myBappId, msgId: msgToDelete.msgId }));
              }
              
              // Clear tracker
              window.lastSentMessage = null;
              
              // Visual Feedback
              if (typeof showToast === 'function') showToast("Message Undone! 🫢");
              else alert("Message Undone!");
              
              return; // Stop here so calculator doesn't open
          } else {
              // If Undo is on but no message sent yet
              if (typeof showToast === 'function') showToast("No recent message to undo");
              return;
          }
      }
      
      // 2. FALLBACK TO PANIC MODE IF UNDO IS OFF
      if (window.enablePanicMode) {
          document.getElementById('fake-calculator').style.display = 'flex';
      }
    }
  });
`;
    html = html.substring(0, startShake) + newShakeLogic + html.substring(endShake);
    fs.writeFileSync('index.html', html);
    console.log('✅ Shake listener rewritten! Undo takes priority over Calculator.');
} else {
    console.log('❌ Could not find the exact shake listener block.');
}
