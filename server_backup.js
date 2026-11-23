const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const USERS_FILE = path.join(__dirname, 'users.json');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

const DB_FILE = path.join(__dirname, 'offline_db.json');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));

app.use(express.static(__dirname));

server.listen(2222, () => {
    console.log('\n=============================================');
    console.log('BAPP running on http://localhost:2222');
    console.log('=============================================\n');
});

const bappUsers = new Map();

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            bappUsers.set(data.userId, ws);
            console.log(`🟢 BAPP Connected: ${data.userId}`);
            
            const db = JSON.parse(fs.readFileSync(DB_FILE));
            if (db[data.userId] && db[data.userId].length > 0) {
                ws.send(JSON.stringify({ type: 'offline_messages', messages: db[data.userId] }));
                delete db[data.userId];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
            }
        }

        
        if (data.type === 'register_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            users[data.username] = true; // Save to database
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            
            bappUsers.set(data.username, ws);
            console.log(`🟢 BAPP User Online: ${data.username}`);
            ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
        }

        if (data.type === 'search_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            const query = data.query.toLowerCase();
            // Find all users that include the search text
            const matches = Object.keys(users).filter(u => u.includes(query) && u !== data.from);
            ws.send(JSON.stringify({ type: 'search_result', matches: matches }));
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

        if (data.type === 'send_message') {
            const { to, from, text, isImage } = data;
            const cleanTo = to.trim();
            
            console.log(`📩 Msg from [${from}] to [${cleanTo}]`);

            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));
                console.log("✅ Delivered to online BAPP user");
            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({ from: from, text: text, isImage: isImage });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Stored offline message");
            }
        }
    });

    ws.on('close', () => {
        for (let [userId, userWs] of bappUsers.entries()) {
            if (userWs === ws) {
                bappUsers.delete(userId);
                console.log(`🔴 BAPP Disconnected: ${userId}`);
            }
        }
    });
});

// --- WHATSAPP BRIDGE ---
let sock = null;
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({ auth: state, printQRInTerminal: false, logger: pino({ level: 'silent' }) });
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('\n--- SCAN TO CONNECT WHATSAPP ---');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Bridge Connected!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const sender = msg.key.remoteJid.split('@')[0];
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            console.log(`📩 WhatsApp Msg from ${sender}: ${text}`);
        }
    });
}
connectToWhatsApp();
