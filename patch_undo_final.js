const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the tracker right after the message is appended in sendMessage
const oldAppend = `appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');`;
const newAppend = `appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');
      
      // --- TRACK LAST SENT MESSAGE FOR SHAKE TO UNDO ---
      window.lastSentMessage = { to: to, msgId: msgId };
      // -------------------------------------------------`;

html = html.replace(oldAppend, newAppend);

// 2. Ensure the Shake Listener has no issues with the deletion logic
const oldShake = `      // Check Panic Mode                                  
      if (window.enablePanicMode) {                        
          document.getElementById('fake-calculator').style.display = 'flex';                                              
      }                                                    
      // Check Shake to Undo                               
      else if (window.enableShakeToUndo) {                 
          if (window.lastSentMessage && window.lastSentMessage.msgId) {                                                   
              const msgToDelete = window.lastSentMessage;  `;

const newShake = `      // Check Panic Mode                                  
      if (window.enablePanicMode) {                        
          document.getElementById('fake-calculator').style.display = 'flex';                                              
      }                                                    
      // Check Shake to Undo                               
      else if (window.enableShakeToUndo) {                 
          if (window.lastSentMessage && window.lastSentMessage.msgId) {                                                   
              const msgToDelete = window.lastSentMessage;  `;

html = html.replace(oldShake, newShake); // This just verifies it's correct

fs.writeFileSync('index.html', html);
console.log('✅ Last Sent Message tracker injected! Shake to Undo will now work.');
