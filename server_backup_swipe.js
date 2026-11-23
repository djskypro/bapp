const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DB_FILE = path.join(__dirname, 'offline_db.json');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

app.use(express.static(__dirname));

server.listen(2222, () => {
    console.log('\n=============================================');
    console.log('BAPP running on http://localhost:2222');
    console.log('=============================================\n');
});

const bappUsers = new Map();
let allUsers = JSON.parse(fs.readFileSync(USERS_FILE));

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            users[data.username] = data.profile || { name: data.username };
            allUsers = users;
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            
            bappUsers.set(data.username, ws);
            console.log(`🟢 BAPP Connected: ${data.username}`);
            ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
            
            const db = JSON.parse(fs.readFileSync(DB_FILE));
            if (db[data.username] && db[data.username].length > 0) {
                ws.send(JSON.stringify({ type: 'offline_messages', messages: db[data.username] }));
                delete db[data.username];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
            }
        }

        if (data.type === 'search_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            const query = data.query.toLowerCase();
            const matches = Object.keys(users).filter(u => u.includes(query) && u !== data.from).map(u => ({ username: u, profile: users[u] }));
            ws.send(JSON.stringify({ type: 'search_result', matches: matches }));
        }

        
        if (data.type === 'recording') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'recording', from: data.from, isRecording: data.isRecording }));
            }
        }

        if (data.type === 'typing') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'typing', from: data.from, isTyping: data.isTyping }));
            }
        }

        if (data.type === 'read_receipt') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'read_receipt', from: data.from }));
            }
        }

        
        if (data.type === 'delete_message') {
            const { to, from, msgId } = data;
            if (bappUsers.has(to)) {
                bappUsers.get(to).send(JSON.stringify({ type: 'message_deleted', msgId: msgId, from: from }));
            }
        }

        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice } = data;
            const cleanTo = to.trim();
            
            console.log(`📩 Msg from [${from}] to [${cleanTo}] isVoice: ${isVoice}`);

            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ 
                    type: 'new_message', 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false 
                }));
                // Send confirmation back to sender
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered (Receipt Sent)");
            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({ 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false 
                });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Offline Saved");
            }
        }
    });

    ws.on('close', () => {
        for (let [userId, userWs] of bappUsers.entries()) {
            if (userWs === ws) {
                bappUsers.delete(userId);
                console.log(`🔴 Disconnected: ${userId}`);
            }
        }
    });
});
