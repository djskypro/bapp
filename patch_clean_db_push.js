const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the exact broken push block
const oldPushRegex = /db\[cleanTo\]\.push\(\{[\s\S]*?\}\);/;

const newPush = `db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false,
                    isVideo: isVideo || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false,
                    bubbleColor: bubbleColor
                });`;

if (serverJs.match(oldPushRegex)) {
    serverJs = serverJs.replace(oldPushRegex, newPush);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server database push cleaned up! No more duplicate keys.');
} else {
    console.log('❌ Could not find the push block.');
}
