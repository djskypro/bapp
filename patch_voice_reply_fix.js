const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add msgId and reply variables and update the socket.send
html = html.replace(
    "socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true }));",
    "const msgId = Date.now().toString();\n            const reply = currentReplyTo;\n            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true, msgId: msgId, replyData: reply }));"
);

// 2. Update appendMessage to include reply data
html = html.replace(
    "appendMessage(base64Audio, 'sent', now, 'sent', false, true);",
    "appendMessage(base64Audio, 'sent', now, 'sent', false, true, msgId, reply);"
);

// 3. Update savedMsgs.push to save the reply data
html = html.replace(
    "savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent' });",
    "savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent', msgId: msgId, replyData: reply });"
);

// 4. Add cancelReply right after saving to local storage
html = html.replace(
    "localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));",
    "localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));\n            if (typeof cancelReply === 'function') cancelReply();"
);

fs.writeFileSync('index.html', html);
console.log('✅ Voice note reply logic fixed line-by-line!');
