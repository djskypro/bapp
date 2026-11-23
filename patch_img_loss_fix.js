const fs = require('fs');

// ==========================================
// 1. FIX CLIENT (confirmMediaSend Offline Queue)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

const oldClientSend = `    socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: !isVid, isVideo: isVid, msgId: msgId, replyData: reply }));`;
    
const newClientSend = `    const payload = { 
        type: 'send_message', 
        to: to, 
        from: myBappId, 
        text: base64Img, 
        isImage: !isVid, 
        isVideo: isVid, 
        msgId: msgId, 
        replyData: reply 
    };
    
    // CHECK IF ONLINE, IF NOT, QUEUE IT
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
    } else {
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        console.log("📩 Image queued. Will send when online.");
    }`;

html = html.replace(oldClientSend, newClientSend);
fs.writeFileSync('index.html', html);

// ==========================================
// 2. FIX SERVER (Clean up offline DB push)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldDbPush = `                db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false, msgId: msgId, replyData: replyData,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper
                });`;

const newDbPush = `                db[cleanTo].push({
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false,
                    isVideo: isVideo || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false,
                    bubbleColor: bubbleColor || null
                });`;

serverJs = serverJs.replace(oldDbPush, newDbPush);
fs.writeFileSync('server.js', serverJs);

console.log('✅ Client queues images when offline. Server DB save is clean!');
