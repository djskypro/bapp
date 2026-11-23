const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Send all messages at once)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerSend = `                // Send one by one with a 200ms delay
                msgsToSend.forEach((msg, index) => {
                    setTimeout(() => {
                        if (ws.readyState === 1) {
                            ws.send(JSON.stringify({ type: 'offline_messages', messages: [msg] }));
                        }
                    }, index * 200);
                });`;

const newServerSend = `                // Send ALL offline messages at once (safer and faster)
                ws.send(JSON.stringify({ type: 'offline_messages', messages: msgsToSend }));
                console.log("📬 Sent " + msgsToSend.length + " offline messages to " + data.username);`;

serverJs = serverJs.replace(oldServerSend, newServerSend);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Group routing & unblock group_created)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Fix the offline message router to handle groups
const oldOfflineSender = `const senderId = (msg.from || '').trim();`;
const newOfflineSender = `const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();`;
html = html.split(oldOfflineSender).join(newOfflineSender);

// B. Unblock group_created from the status wrapper
const oldWrapper = `if(data.type !== 'statuses_list' && data.type !== 'new_status' && data.type !== 'group_created') {`;
const newWrapper = `if(data.type !== 'statuses_list' && data.type !== 'new_status') {`;
html = html.replace(oldWrapper, newWrapper);

fs.writeFileSync('index.html', html);
console.log('✅ Offline delivery and Group routing fixed!');
