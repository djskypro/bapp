const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Broadcast when a user connects
const oldRegister = `ws.send(JSON.stringify({ type: 'register_success', username: data.username }));`;
const newRegister = `ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
            
            // Broadcast the online list to EVERYONE
            const onlineList = Array.from(bappUsers.keys());
            for (let client of bappUsers.values()) {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ type: 'online_users', users: onlineList }));
                }
            }`;
serverJs = serverJs.replace(oldRegister, newRegister);

// 2. Broadcast when a user disconnects
const oldClose = `ws.on('close', () => {`;
const newClose = `ws.on('close', () => {
        // Find who disconnected and broadcast
        let disconnectedUser = null;
        for (let [username, clientWs] of bappUsers.entries()) {
            if (clientWs === ws) {
                disconnectedUser = username;
                break;
            }
        }
        if (disconnectedUser) {
            bappUsers.delete(disconnectedUser);
            const onlineList = Array.from(bappUsers.keys());
            for (let client of bappUsers.values()) {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ type: 'online_users', users: onlineList }));
                }
            }
        }`;
serverJs = serverJs.replace(oldClose, newClose);

fs.writeFileSync('server.js', serverJs);
console.log("✅ Server now broadcasts online users!");
