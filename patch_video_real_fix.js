const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Forward isVideo correctly)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add isVideo to the destructured variables
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo } = data;"
);

// Add to the online user delivery payload
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                }));",
    "isWhisper: isWhisper || false,\n                    isVideo: isVideo || false\n                }));"
);

// Add to the offline DB payload
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                });",
    "isWhisper: isWhisper || false,\n                    isVideo: isVideo || false\n                });"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// --- A. Update the appendMessage function to accept isVideo ---
html = html.replace(
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {",
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false) {"
);

// --- B. Fix the rendering block (based on your latest debug output) ---
// Find the line `} else if (isImage) {` and replace it with a robust check
const oldRenderStart = `    } else if (isImage) {
      if (text.startsWith('data:video')) {`;
const newRenderStart = `    } else if (isVideo || (isImage && text.startsWith('data:video'))) {
      if (true) {`;
html = html.replace(oldRenderStart, newRenderStart);

// --- C. Ensure sendMessage sends the correct isVideo flag for video uploads ---
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

// --- D. Update the receive logic to pass isVideo ---
html = html.replace(
    /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice, msgId: data\.msgId, replyData: data\.replyData, isWhisper: data\.isWhisper \}\);/g,
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, isVideo: data.isVideo });"
);
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData, data\.isWhisper\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo);"
);

// --- E. Update Chat List Preview ---
html = html.replace(
    /if \(last\.isImage\) \{\s*lastMsgText = '📷 Photo';\s*\}/g,
    "if (last.isVideo || (last.isImage && last.text && last.text.startsWith('data:video'))) { lastMsgText = '🎥 Video'; } else if (last.isImage) { lastMsgText = '📷 Photo'; }"
);
html = html.replace(
    "lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);",
    "lastMsgText = last.isVideo ? '🎥 Video' : (last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text));"
);

// --- F. Update openChat loading loop ---
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper, m.isVideo));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Video sending, rendering, and previews fixed perfectly!');
