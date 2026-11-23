const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Save Group Creation for Offline Users)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const groupRegex = /if \(data\.type === 'create_group'\) \{[\s\S]*?\n        \}/;

const newGroupBlock = `if (data.type === 'create_group') {
            const { groupId, groupName, members, creator } = data;
            members.forEach(member => {
                if (member !== creator) {
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members }));
                        targetWs.send(JSON.stringify({
                            type: 'new_message', from: creator, text: "👋 You were added to the group: " + groupName,
                            msgId: Date.now().toString(), isGroup: true, groupId: groupId, groupMembers: members, bubbleColor: '#005c4b'
                        }));
                    } else {
                        // OFFLINE USER: Save group event to database
                        let db = {};
                        try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
                        if (!db[member]) db[member] = [];
                        db[member].push({
                            isGroupEvent: true, groupId: groupId, groupName: groupName, members: members, creator: creator,
                            text: "👋 You were added to the group: " + groupName, from: creator, msgId: Date.now().toString(), isGroup: true
                        });
                        try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}
                    }
                }
            });
        }`;

serverJs = serverJs.replace(groupRegex, newGroupBlock);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Handle Offline Group Events)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// We look for the offline messages handler and inject the group logic
const oldOfflineSender = `const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();`;

const newOfflineSender = `const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();
                    
                    // HANDLE OFFLINE GROUP CREATION
                    if (msg.isGroupEvent) {
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                    }`;

html = html.replace(oldOfflineSender, newOfflineSender);
fs.writeFileSync('index.html', html);
console.log('✅ Offline groups & messages patched successfully!');
