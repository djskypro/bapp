const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the appendMessage function signature (Line 1758)
const oldSignature = `function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {`;
const newSignature = `function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {`;
html = html.replace(oldSignature, newSignature);

// 2. Force the color to apply so CSS doesn't override it
const oldApply = `if (bubbleColor && type === 'sent') newMsg.style.backgroundColor = bubbleColor;`;
const newApply = `if (bubbleColor && type === 'sent') { newMsg.style.setProperty('background-color', bubbleColor, 'important'); }`;
html = html.replace(oldApply, newApply);

// 3. Update the older duplicate sendMessage functions to pass the color
// (Line 3489)
html = html.replace(
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);",
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, false, false, myProfile.bubbleColor || '#005c4b');"
);
// (Line 3944)
html = html.replace(
    "appendMessage(text, 'sent', now, status, false, false, msgId, reply);",
    "appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');"
);

// 4. Ensure the receive message block passes it correctly
html = html.replace(
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);",
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);"
);

fs.writeFileSync('index.html', html);
console.log('✅ Function signature fixed and color forced to apply!');
