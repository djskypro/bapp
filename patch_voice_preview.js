const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the block of code in loadChatList that generates the preview text
const oldPreviewLogic = `if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgText = last.isImage ? '📷 Photo' : last.text;
        lastMsgTime = last.time || '';
      }`;

const newPreviewLogic = `if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgTime = last.time || '';
        
        if (last.isImage) {
          lastMsgText = '📷 Photo';
        } else if (last.isVoice || (last.text && last.text.startsWith('data:audio'))) {
          lastMsgText = '🎤 Voice Note';
        } else {
          lastMsgText = last.text;
        }
      }`;

// 1. Try exact match
if (html.includes(oldPreviewLogic)) {
    html = html.replace(oldPreviewLogic, newPreviewLogic);
} else {
    // 2. Fallback regex match in case formatting is slightly different
    const regex = /if \(msgs\.length > 0\) \{[\s\S]*?lastMsgText = last\.isImage \? '📷 Photo' : last\.text;[\s\S]*?\}/;
    html = html.replace(regex, newPreviewLogic);
}

fs.writeFileSync('index.html', html);
console.log('✅ Chat list preview fixed for voice notes!');
