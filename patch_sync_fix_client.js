const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Ensure the group creation logic in the offline handler is bulletproof
const oldGroupEvent = `if (msg.isGroupEvent) {
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                        
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msg.groupId)) || [];
                        msgs.push({ text: msg.text, type: 'received', time: now, msgId: msg.msgId });
                        localStorage.setItem('bapp_msgs_' + msg.groupId, JSON.stringify(msgs));
                        saveChat(msg.groupId);
                    }`;

const newGroupEvent = `if (msg.isGroupEvent) {
                        // Create the group FIRST
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                        
                        // THEN add the welcome message
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msg.groupId)) || [];
                        msgs.push({ text: msg.text, type: 'received', time: now, msgId: msg.msgId });
                        localStorage.setItem('bapp_msgs_' + msg.groupId, JSON.stringify(msgs));
                        
                        saveChat(msg.groupId);
                        console.log("Offline Group Created:", msg.groupName);
                    }`;

html = html.replace(oldGroupEvent, newGroupEvent);

// 2. Add a 1-second delay before sending sync_ack (so IndexedDB finishes saving images)
const oldAck = `// TELL SERVER: "I saved them all, you can delete them now"
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
            }`;

const newAck = `// TELL SERVER: "I saved them all, you can delete them now"
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
                    console.log("✅ Sync ACK sent to server.");
                }
            }, 1000); // 1 second delay for DB writes`;

html = html.replace(oldAck, newAck);

fs.writeFileSync('index.html', html);
console.log('✅ Client Group sync & DB wait logic fixed!');
