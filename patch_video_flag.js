const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix all instances where the isVideo flag is hardcoded to false
const oldCall = `appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, false, data.bubbleColor);`;
const newCall = `appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);`;

let count = 0;
while (html.includes(oldCall)) {
    html = html.replace(oldCall, newCall);
    count++;
}

fs.writeFileSync('index.html', html);
console.log(`✅ Fixed ${count} appendMessage calls to pass data.isVideo!`);
