const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact start and end of the offline_messages handler
const startIdx = html.indexOf("if (data.type === 'offline_messages') {");
const endIdx = html.indexOf("if (data.type === 'new_message') {", startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newOfflineHandler = `if (data.type === 'offline_messages') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        (async () => {
            for (const msg of data.messages) {
                try {
                    const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();
                    
                    if (msg.isGroupEvent) {
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                        
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msg.groupId)) || [];
                        msgs.push({ text: msg.text, type: 'received', time: now, msgId: msg.msgId });
                        localStorage.setItem('bapp_msgs_' + msg.groupId, JSON.stringify(msgs));
                        saveChat(msg.groupId);
                    } 
                    else {
                        let saveText = msg.text;
                        
                        // --- CRITICAL FIX: AWAIT THE DATABASE SAVE ---
                        if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                await saveImgToDB(msg.msgId, msg.text);
                                console.log("✅ Offline Image saved to DB:", msg.msgId);
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }
                        
                        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                        if (msg.msgId && savedMsgs.some(m => m.msgId === msg.msgId)) continue;
                        
                        savedMsgs.push({
                            text: saveText, type: 'received', time: now, isImage: msg.isImage, isVoice: msg.isVoice,
                            msgId: msg.msgId, replyData: msg.replyData, isWhisper: msg.isWhisper, isVideo: msg.isVideo, bubbleColor: msg.bubbleColor
                        });
                        
                        try {
                            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                        } catch (storageErr) {
                            for (let i = 0; i < localStorage.length; i++) {
                                let key = localStorage.key(i);
                                if (key.startsWith('bapp_msgs_')) {
                                    let msgs = JSON.parse(localStorage.getItem(key)) || [];
                                    msgs.forEach(m => { if (m.isImage && m.text && m.text.startsWith('data:image')) { m.text = "📷 [Image removed]"; m.isImage = false; } });
                                    localStorage.setItem(key, JSON.stringify(msgs));
                                }
                            }
                            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                        }
                        
                        saveChat(senderId);
                        if (activeChatId === senderId) {
                            appendMessage(saveText, 'received', now, '', msg.isImage, msg.isVoice, msg.msgId, msg.replyData, msg.isWhisper, msg.isVideo, msg.bubbleColor);
                        } else {
                            let unreads = getUnreads();
                            unreads[senderId] = (unreads[senderId] || 0) + 1;
                            localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
                        }
                    }
                } catch(e) { console.error("Skipped broken message", e); }
            }
            
            loadChatList();
            
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
                    console.log("✅ Sync ACK sent.");
                }
            }, 1000);
        })();
      }
      
      `;
    html = html.substring(0, startIdx) + newOfflineHandler + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Offline images will now be saved to DB before rendering!');
} else {
    console.log('❌ Could not find offline_messages block boundaries.');
}
