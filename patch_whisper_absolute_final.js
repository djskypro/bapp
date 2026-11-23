const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX THE SEND MESSAGE (Line 1746-1753)
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
const oldLocalSave = `savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });`;
const newLocalSave = `savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo, isWhisper: window.isWhisperMode });`;
html = html.replace(oldLocalSave, newLocalSave);

// ==========================================
// 3. FIX THE SEND BUTTON APPENDMESSAGE (Line 1755)
// ==========================================
const oldSendAppend = `appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, window.isWhisperMode);`;
// This one is already correct, so we leave it.

// ==========================================
// 4. FIX THE RECEIVE MESSAGE (Line 2560+ - The duplicate block that isn't getting the flag in appendMessage)
// ==========================================
// Your terminal output shows line 2570 saves isWhisper, but we need to make sure it passes to appendMessage.
// We'll use a regex to be safe since we don't see the exact append call for line 2560+.
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);"
);

// ==========================================
// 5. FIX THE OPENCHAT LOOP (Loading from memory)
// ==========================================
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));"
);

// ==========================================
// 6. FIX THE SERVER (Forward isWhisper)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper } = data;"
);
// Make sure it's forwarded to online user
serverJs = serverJs.replace(
    "replyData: replyData\n                }));",
    "replyData: replyData,\n                    isWhisper: isWhisper\n                }));"
);
// Make sure it's saved for offline user
serverJs = serverJs.replace(
    "replyData: replyData\n                });",
    "replyData: replyData,\n                    isWhisper: isWhisper\n                });"
);
fs.writeFileSync('server.js', serverJs);

fs.writeFileSync('index.html', html);
console.log('✅ All 5 lines patched! isWhisper will now flow from button -> server -> receiver -> storage.');
