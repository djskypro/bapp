const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the ONLINE receiver block to include isVideo
const oldSave = `savedMsgs.push({ text: saveText, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });`;
const newSave = `savedMsgs.push({ text: saveText, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, isVideo: data.isVideo, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });`;

if (html.includes(oldSave)) {
    html = html.replace(oldSave, newSave);
    fs.writeFileSync('index.html', html);
    console.log('✅ Online receiver now saves isVideo!');
} else {
    console.log('❌ Could not find the online save block.');
}
