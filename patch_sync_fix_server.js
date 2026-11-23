const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldSend = `                ws.send(JSON.stringify({ type: 'offline_messages', messages: msgsToSend }));
                console.log("📬 Sent " + msgsToSend.length + " offline messages to " + data.username);`;

const newSend = `                // Send one by one with a 300ms delay to prevent WebSocket truncation
                msgsToSend.forEach((msg, index) => {
                    setTimeout(() => {
                        if (ws.readyState === 1) {
                            ws.send(JSON.stringify({ type: 'offline_messages', messages: [msg] }));
                        }
                    }, index * 300);
                });
                console.log("📬 Queued " + msgsToSend.length + " offline messages for " + data.username);`;

serverJs = serverJs.replace(oldSend, newSend);
fs.writeFileSync('server.js', serverJs);
console.log('✅ Server will now send offline messages one by one!');
