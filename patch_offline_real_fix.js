const fs = require('fs');

// ==========================================
// 1. FIX THE SERVER (Send one by one)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerSend = `                ws.send(JSON.stringify({ type: 'offline_messages', messages: db[data.username] }));
                delete db[data.username];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));`;

const newServerSend = `                const msgsToSend = db[data.username];
                delete db[data.username];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                
                // Send one by one with a 200ms delay
                msgsToSend.forEach((msg, index) => {
                    setTimeout(() => {
                        if (ws.readyState === 1) {
                            ws.send(JSON.stringify({ type: 'offline_messages', messages: [msg] }));
                        }
                    }, index * 200);
                });`;

serverJs = serverJs.replace(oldServerSend, newServerSend);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX THE CLIENT (Save voice, images, replies)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact offline_messages block from your output
const oldClientReceive = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          // 1. Save to local storage
          try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            savedMsgs.push({ text: msg.text, type: 'received', time: now, isImage: msg.isImage });
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e) {}
          
          // 2. Save to chat list
          saveChat(senderId);
          
          // 3. Update UI
          if (activeChatId === senderId) {
            appendMessage(msg.text, 'received', now, '', msg.isImage);
          } else {
            let unreads = getUnreads();
            unreads[senderId] = (unreads[senderId] || 0) + 1;
            localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
          }
        });
        
        loadChatList(); // Refresh the list`;

const newClientReceive = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            // SAVE ALL MEDIA TYPES AND REPLIES
            savedMsgs.push({ 
                text: msg.text, 
                type: 'received', 
                time: now, 
                isImage: msg.isImage, 
                isVoice: msg.isVoice,
                msgId: msg.msgId,
                replyData: msg.replyData
            });
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e) { console.error("Storage full"); }
          
          saveChat(senderId);
          
          if (activeChatId === senderId) {
            // RENDER ALL MEDIA TYPES AND REPLIES
            appendMessage(msg.text, 'received', now, '', msg.isImage, msg.isVoice, msg.msgId, msg.replyData);
            socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
          } else {
            let unreads = getUnreads();
            unreads[senderId] = (unreads[senderId] || 0) + 1;
            localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
          }
        });
        
        loadChatList();`;

if (html.includes(oldClientReceive)) {
    html = html.replace(oldClientReceive, newClientReceive);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client patched perfectly!');
} else {
    // Fallback if spacing is off
    const regex = /data\.messages\.forEach\(msg => \{[\s\S]*?loadChatList\(\); \/\/ Refresh the list/;
    html = html.replace(regex, newClientReceive);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client patched via regex!');
}
