const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We find the offline_messages block and wrap it in a bulletproof loop
const startIdx = html.indexOf("if (data.type === 'offline_messages') {");
const endIdx = html.indexOf("if (data.type === 'new_message') {", startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newSyncHandler = `if (data.type === 'offline_messages') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        (async () => {
            for (const msg of data.messages) {
                try {
                    const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();
                    
                    // Handle Group Creation Event
                    if (msg.isGroupEvent) {
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                        
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msg.groupId)) || [];
                        msgs.push({ text: msg.text, type: 'received', time: now, msgId: msg.msgId });
                        localStorage.setItem('bapp_msgs_' + msg.groupId, JSON.stringify(msgs));
                        saveChat(msg.groupId);
                    } 
                    // Handle Normal Message / Image
                    else {
                        let saveText = msg.text;
                        if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                await saveImgToDB(msg.msgId, msg.text);
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }
                        
                        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                        savedMsgs.push({
                            text: saveText, type: 'received', time: now, isImage: msg.isImage, isVoice: msg.isVoice,
                            msgId: msg.msgId, replyData: msg.replyData, isWhisper: msg.isWhisper, isVideo: msg.isVideo, bubbleColor: msg.bubbleColor
                        });
                        localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                        saveChat(senderId);
                        
                        if (activeChatId === senderId) {
                            appendMessage(saveText, 'received', now, '', msg.isImage, msg.isVoice, msg.msgId, msg.replyData, msg.isWhisper, msg.isVideo, msg.bubbleColor);
                        }
                    }
                } catch(e) { 
                    console.error("Skipped a broken offline message", e); 
                }
            }
            
            loadChatList();
            
            // TELL SERVER: "I saved them all, you can delete them now"
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
            }
        })();
      }
      
      `;
    html = html.substring(0, startIdx) + newSyncHandler + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client Sync Engine ready!');
} else {
    console.log('❌ Could not find offline_messages block boundaries.');
}
