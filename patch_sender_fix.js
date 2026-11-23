const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the sender's appendMessage call
const oldCall = `appendMessage(data.url, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);`;
const newCall = `appendMessage(data.url, 'sent', now, 'sent', true, false, msgId, reply, false, isVid);`;

if (html.includes(oldCall)) {
    html = html.replace(oldCall, newCall);
    fs.writeFileSync('index.html', html);
    console.log('✅ Sender now passes isImage: true for all media!');
} else {
    console.log('❌ Could not find the sender appendMessage call.');
}
