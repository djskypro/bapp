const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Send all messages at once)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldSendRegex = /msgsToSend\.forEach\(\(msg, index\) => \{[\s\S]*?\}, index \* 300\);\s*\}\);/;
const newSend = `if (ws.readyState === 1) {
                        ws.send(JSON.stringify({ type: 'offline_messages', messages: msgsToSend }));
                        console.log("📬 Sent " + msgsToSend.length + " offline messages to " + data.username);
                    }`;

serverJs = serverJs.replace(oldSendRegex, newSend);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Groups & Offline Processing)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Fix the Payload (Force `isGroup` and `groupMembers` into the payload)
const payloadRegex = /const payload = \{\s*type:\s*'send_message',\s*to:\s*to,\s*from:\s*myBappId,\s*text:\s*text,\s*msgId:\s*msgId,\s*replyData:\s*reply,\s*bubbleColor:\s*myProfile\.bubbleColor \|\| '#005c4b'\s*\};/;

const newPayload = `// --- CHECK IF IT'S A GROUP MESSAGE ---
      const isGroup = activeChatId.startsWith('group_');
      let groupMembers = [];
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
      }

      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b',
          isGroup: isGroup,
          groupMembers: groupMembers
      };`;

html = html.replace(payloadRegex, newPayload);

// B. Fix the offline receiver to safely handle all messages and wait for DB
const startIdx = html.indexOf("if (data.type === 'offline_messages') {");
const endIdx = html.indexOf("if (data.type === 'new_message') {", startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newOffline = `if (data.type === 'offline_messages') {
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
                } catch(e) { console.error("Skipped broken message", e); }
            }
            
            loadChatList();
            
            // TELL SERVER (ACK) AFTER 1 SECOND TO LET DB FINISH SAVING
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
                    console.log("✅ Sync ACK sent.");
                }
            }, 1000);
        })();
      }
      
      `;
    html = html.substring(0, startIdx) + newOffline + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Server & Client sync logic fixed!');
} else {
    console.log('❌ Could not find offline_messages block boundaries.');
}
