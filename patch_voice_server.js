const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add isVoice to the forwarded message data
serverJs = serverJs.replace(
    "const { to, from, text, isImage } = data;",
    "const { to, from, text, isImage, isVoice } = data;"
);
serverJs = serverJs.replace(
    "bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));",
    "bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage, isVoice: isVoice }));"
);
serverJs = serverJs.replace(
    "db[cleanTo].push({ from: from, text: text, isImage: isImage });",
    "db[cleanTo].push({ from: from, text: text, isImage: isImage, isVoice: isVoice });"
);
serverJs = serverJs.replace(
    "ws.send(JSON.stringify({ type: 'offline_messages', messages: db[data.userId] }));",
    "ws.send(JSON.stringify({ type: 'offline_messages', messages: db[data.userId] }));"
);

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server patched for voice notes!');
