const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the sender's localStorage save
const oldSave = `savedMsgs.push({ text: data.url, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId });`;
const newSave = `savedMsgs.push({ text: data.url, type: 'sent', time: now, isImage: true, isVideo: isVid, status: 'sent', msgId: msgId });`;

if (html.includes(oldSave)) {
    html = html.replace(oldSave, newSave);
    fs.writeFileSync('index.html', html);
    console.log('✅ Sender localStorage now saves isImage: true for videos!');
} else {
    console.log('❌ Could not find the localStorage save line.');
}
