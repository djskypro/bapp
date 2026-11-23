const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Pass isVideo flag)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isVideo } = data;"
);
// Add to online delivery
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                }));",
    "isWhisper: isWhisper || false,\n                    isVideo: isVideo || false\n                }));"
);
// Add to offline DB
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                });",
    "isWhisper: isWhisper || false,\n                    isVideo: isVideo || false\n                });"
);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. UPDATE CLIENT SEND LOGIC
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Update the video upload to send isVideo: true
html = html.replace(
    "socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Video, isImage: true, msgId: msgId, replyData: reply }));",
    "socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Video, isVideo: true, msgId: msgId, replyData: reply }));"
);
html = html.replace(
    "appendMessage(base64Video, 'sent', now, 'sent', true, false, msgId, reply);",
    "appendMessage(base64Video, 'sent', now, 'sent', false, false, msgId, reply, false, true);"
);
html = html.replace(
    "savedMsgs.push({ text: base64Video, type: 'sent', time: now, isImage: true, status: 'sent', msgId: msgId, replyData: reply });",
    "savedMsgs.push({ text: base64Video, type: 'sent', time: now, isVideo: true, status: 'sent', msgId: msgId, replyData: reply });"
);

// ==========================================
// 3. UPDATE CLIENT APPENDMESSAGE (Render Video Properly)
// ==========================================
// We add isVideo to the function signature
html = html.replace(
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {",
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false) {"
);

// We fix the rendering block to check for isVideo first
const oldRender = `    } else if (isImage) {
      if (text.startsWith('data:video')) {`;
const newRender = `    } else if (isVideo || (isImage && text.startsWith('data:video'))) {
      if (true) {`;
html = html.replace(oldRender, newRender);

// ==========================================
// 4. UPDATE CHAT LIST PREVIEW
// ==========================================
// Fix the preview text to show "Video"
html = html.replace(
    /if \(last\.isImage\) \{\s*lastMsgText = '📷 Photo';\s*\}/g,
    "if (last.isVideo || (last.isImage && last.text && last.text.startsWith('data:video'))) { lastMsgText = '🎥 Video'; } else if (last.isImage) { lastMsgText = '📷 Photo'; }"
);
html = html.replace(
    "lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);",
    "lastMsgText = last.isVideo ? '🎥 Video' : (last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text));"
);

// ==========================================
// 5. UPDATE RECEIVER LOGIC (Pass isVideo)
// ==========================================
html = html.replace(
    /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice, msgId: data\.msgId, replyData: data\.replyData, isWhisper: data\.isWhisper \}\);/g,
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, isVideo: data.isVideo });"
);
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData, data\.isWhisper\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo);"
);

// ==========================================
// 6. UPDATE OPENCHAT LOADING
// ==========================================
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper, m.isVideo));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Video send, render, and chat list preview fixed!');
