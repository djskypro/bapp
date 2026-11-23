const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX THE SEND FUNCTION (Lines 1746-1753)
// ==========================================
const oldSend = `      socket.send(JSON.stringify({                           
          type: 'send_message',                              
          to: activeChatId,                                  
          from: myBappId,                                    
          text: text,                                        
          msgId: msgId,                                      
          replyData: currentReplyTo                          
      }));`;

const newSend = `      const isWhisper = window.isWhisperMode === true;
      socket.send(JSON.stringify({                           
          type: 'send_message',                              
          to: activeChatId,                                  
          from: myBappId,                                    
          text: text,                                        
          msgId: msgId,                                      
          replyData: currentReplyTo,
          isWhisper: isWhisper
      }));`;

html = html.replace(oldSend, newSend);

// The appendMessage call right below send needs the flag too
// I'll use a regex to target it safely
html = html.replace(
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);",
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, window.isWhisperMode);"
);

// ==========================================
// 2. FIX THE SOCKET RECEIVER (Somewhere further down)
// ==========================================
// We need to make sure data.isWhisper is saved and passed to appendMessage
html = html.replace(
    /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice, msgId: data\.msgId, replyData: data\.replyData \}\);/g,
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper });"
);

html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);"
);

// ==========================================
// 3. FIX OPENCHAT (Loading from memory)
// ==========================================
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));"
);

fs.writeFileSync('index.html', html);
console.log('✅ isWhisper flag is now being sent and received correctly!');
