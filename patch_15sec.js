const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX SEND MESSAGE (Line 1746-1753 from your output)
// ==========================================
const oldSend = `      socket.send(JSON.stringify({                           
          type: 'send_message',                              
          to: activeChatId,                                  
          from: myBappId,                                    
          text: text,                                        
          msgId: msgId,                                      
          replyData: currentReplyTo                          
      }));`;

const newSend = `      const whisperFlag = window.isWhisperMode === true;
      socket.send(JSON.stringify({                           
          type: 'send_message',                              
          to: activeChatId,                                  
          from: myBappId,                                    
          text: text,                                        
          msgId: msgId,                                      
          replyData: currentReplyTo,
          isWhisper: whisperFlag
      }));`;

html = html.replace(oldSend, newSend);

// ==========================================
// 2. FIX LOCAL STORAGE (Line 1759)
// ==========================================
html = html.replace(
    "savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });",
    "savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo, isWhisper: window.isWhisperMode });"
);

// ==========================================
// 3. FIX APPEND MESSAGE (The Timer Logic)
// ==========================================
// Based on your output, line 1680 is where we check for isWhisper
const oldWhisperCheck = `    if (isWhisper && type === 'received') {
        newMsg.classList.add('whisper-locked');
        newMsg.innerHTML = '🔒 Tap here to view secret message';
        
        newMsg.onclick = function() {
            // Unlock the message
            newMsg.classList.remove('whisper-locked');
            newMsg.innerHTML = ''; // Clear the lock text
            
            // Render the real message (without the whisper flag)
            renderNormalMessage(newMsg, text, type, timeStr, status, isImage, isVoice, replyData);
        };
    } else {`;

const newWhisperCheck = `    // --- 15 SECOND TIMER LOGIC ---
    if (isWhisper) {
        // Start the 15-second countdown as soon as the message is added
        setTimeout(() => {
            newMsg.style.transition = 'opacity 1s ease';
            newMsg.style.opacity = '0';
            setTimeout(() => {
                newMsg.remove(); // Remove from screen
                // Remove from phone memory so it doesn't come back
                const chatId = activeChatId;
                if (chatId) {
                    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + chatId)) || [];
                    msgs = msgs.filter(m => m.msgId !== id);
                    localStorage.setItem('bapp_msgs_' + chatId, JSON.stringify(msgs));
                }
            }, 1000);
        }, 15000); // 15 seconds
    }

    if (isWhisper && type === 'received') {
        newMsg.classList.add('whisper-locked');
        newMsg.innerHTML = '🔒 Tap here to view secret message';
        
        newMsg.onclick = function() {
            newMsg.classList.remove('whisper-locked');
            newMsg.innerHTML = ''; 
            renderNormalMessage(newMsg, text, type, timeStr, status, isImage, isVoice, replyData);
        };
    } else {`;

html = html.replace(oldWhisperCheck, newWhisperCheck);

// ==========================================
// 4. FIX SERVER (Forward flag)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper } = data;"
);
serverJs = serverJs.replace(
    "replyData: replyData\n                }));",
    "replyData: replyData,\n                    isWhisper: isWhisper\n                }));"
);
fs.writeFileSync('server.js', serverJs);

fs.writeFileSync('index.html', html);
console.log('✅ The 15-second timer is now active for all whisper messages.');
