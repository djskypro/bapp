const express = require('express');
const multer = require('multer');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) : null;


function saveImageToFile(text, isImage) {
    if (!isImage || !text || !text.startsWith('data:image')) return text;
    try {
        const filename = 'img_' + Date.now() + '_' + Math.floor(Math.random()*1000) + '.jpg';
        const base64Data = text.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(path.join(__dirname, 'media', filename), base64Data, 'base64');
        console.log("💾 Saved image file:", filename);
        return '/media/' + filename;
    } catch(e) { 
        console.error("❌ Failed to save image file:", e); 
        return text; // Fallback to base64
    }
}

const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, mediaDir),
    filename: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video');
        
        // Get the original extension from the uploaded file name
        const originalExt = file.originalname.split('.').pop().toLowerCase();
        const ext = '.' + originalExt; 
        
        const prefix = isVideo ? 'vid_' : 'img_';
        cb(null, prefix + Date.now() + ext);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, maxPayload: 150 * 1024 * 1024 });

const DB_FILE = path.join(__dirname, 'offline_db.json');

const STATUSES_FILE = path.join(__dirname, 'statuses.json');
if (!fs.existsSync(STATUSES_FILE)) fs.writeFileSync(STATUSES_FILE, JSON.stringify([]));

const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

app.use('/media', express.static(path.join(__dirname, 'media')));

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        console.log("📤 File uploaded:", req.file.filename);
        res.json({ url: '/media/' + req.file.filename });
    } catch(e) { 
        console.log("Upload error:", e);
        res.status(500).json({ error: 'Upload failed' }); 
    }
});

app.use(express.static(__dirname));

server.listen(process.env.PORT || 2222, () => {
    console.log('\n=============================================');
    console.log('BAPP running on http://localhost:2222');
    console.log('=============================================\n');
});

const bappUsers = new Map();
let allUsers = JSON.parse(fs.readFileSync(USERS_FILE));

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        // --- FORCE TRIVIA ROUTING ---
        if (data.type === 'rps_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; 
        }
        
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; // STOP processing. Do not let it become a chat message.
        }


        // --- TRIVIA ROUTING ---
        
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                // Send the exact data back to the other user
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; // Stop processing this message as a normal chat
        }

        // ----------------------


        


        


        
        if (data.type === 'get_statuses') {
            let statuses = [];
            try { statuses = JSON.parse(fs.readFileSync(STATUSES_FILE)); } catch(e) {}
            // Clean up statuses older than 24 hours
            const now = Date.now();
            statuses = statuses.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
            fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
            ws.send(JSON.stringify({ type: 'statuses_list', statuses: statuses }));
        }

        if (data.type === 'add_status') {
            let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));
            const newStatus = {
                id: Date.now().toString(),
                username: data.username,
                text: data.text,
                media: data.media,
                views: [],
                timestamp: Date.now()
            };
            statuses.push(newStatus);
            fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
            
            // Broadcast to everyone (simulating a feed)
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ type: 'new_status', status: newStatus }));
                }
            });
        }

        
        if (data.type === 'view_status') {
            let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));
            let status = statuses.find(s => s.id === data.statusId);
            if (status) {
                if (!status.views) status.views = []; // Fix for old statuses
                if (!status.views.includes(data.viewer)) {
                    status.views.push(data.viewer);
                    fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
                }
            }
        }

        if (data.type === 'register_user') {
            const uname = String(data.username || '').trim().toLowerCase();
            const prof = data.profile || { name: uname };
            if (uname) {
                const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE) || "{}") : {};
                users[uname] = prof;
                allUsers = users;
                try { fs.writeFileSync(USERS_FILE, JSON.stringify(users)); } catch (e) {}
                if (supabase) {
                    supabase.from('user').upsert({ username: uname, profile: prof }, { onConflict: 'username' }).then(({ error }) => {
                        if (error) console.error("❌ Supabase register_user:", error.message);
                    });
                }
            }
        }

        if (data.type === 'search_user') {
            const query = String(data.query || '').trim().toLowerCase();
            const me = String(data.from || '').trim().toLowerCase();
            if (supabase) {
                supabase.from('user').select('username, profile').ilike('username', `%${query}%`).then(({ data: rows, error }) => {
                    if (error) {
                        console.error("❌ Supabase search_user:", error.message);
                        ws.send(JSON.stringify({ type: 'search_result', matches: [] }));
                        return;
                    }
                    const matches = (rows || [])
                        .filter(r => String(r.username || '').toLowerCase() !== me)
                        .map(r => ({ username: r.username, profile: r.profile || { name: r.username } }));
                    ws.send(JSON.stringify({ type: 'search_result', matches }));
                });
            } else {
                let users = {};
                try { users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "{}") : {}; } catch (e) {}
                if (Object.keys(users).length === 0 && typeof allUsers === "object" && allUsers) users = allUsers;
                const matches = Object.keys(users)
                    .filter(u => u.toLowerCase().includes(query) && u.toLowerCase() !== me)
                    .map(u => ({ username: u, profile: users[u] }));
                ws.send(JSON.stringify({ type: 'search_result', matches }));
            }
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

        
        
        if (data.type === 'ghost_delete') {
            const { to, from, msgId } = data;
            if (bappUsers.has(to)) {
                bappUsers.get(to).send(JSON.stringify({ type: 'ghost_deleted', msgId: msgId, from: from }));
            }
        }

        if (data.type === 'delete_message') {
            const { to, from, msgId } = data;
            if (bappUsers.has(to)) {
                bappUsers.get(to).send(JSON.stringify({ type: 'message_deleted', msgId: msgId, from: from }));
            }
        }

        
        if (data.type === 'create_group') {
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
        }

        if (data.type === 'add_group_member') {
            const { groupId, newMember } = data;
            const targetWs = bappUsers.get(newMember);
            if (targetWs && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({ type: 'added_to_group', groupId }));
            }
        }

        if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor, isGroup, groupMembers } = data;
            const cleanTo = to ? to.trim() : null;
            if (!cleanTo) return;
            
            console.log(`📩 Msg from [${from}] to [${cleanTo}] isGroup: ${isGroup} | Members: ${JSON.stringify(groupMembers)}`);

            // --- GROUP MESSAGE ROUTING ---
            // If groupMembers is empty, try to get them from the database
            if (isGroup && (!groupMembers || groupMembers.length === 0)) {
                try {
                    // We don't have group storage on the server, so we can't easily get members
                    // Instead, just trust the sender's member list
                } catch(e) {}
            }
            
            if (isGroup && groupMembers && groupMembers.length > 0) {
                groupMembers.forEach(member => {
                    if (member === from) return; // Don't send to yourself
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({
                            type: 'new_message', from: from, text: text, isImage: isImage || false, isVoice: isVoice || false,
                            msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, isVideo: isVideo || false, 
                            bubbleColor: bubbleColor, isGroup: true, groupId: cleanTo, groupMembers: groupMembers
                        }));
                    } else {
                        // Save for offline member
                        let db = {};
                        try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
                        if (!db[member]) db[member] = [];
                        db[member].push({
                            from: from, text: saveImageToFile(text, isImage), isImage: isImage || false, isVoice: isVoice || false, isVideo: isVideo || false,
                            msgId: msgId, replyData: replyData, isWhisper: isWhisper || false, bubbleColor: bubbleColor,
                            isGroup: true, groupId: cleanTo, groupMembers: groupMembers
                        });
                        try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}
                    }
                });
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                return; // Stop here so it doesn't run the single-user logic below
            }

            // --- SINGLE USER MESSAGE ROUTING ---
            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;

            if (targetWs && targetWs.readyState === 1) {
                try {
                    targetWs.send(JSON.stringify({
                        type: 'new_message',
                        from: from,
                        text: text,
                        isImage: isImage || false,
                        isVoice: isVoice || false,
                        msgId: msgId,
                        replyData: replyData,
                        isWhisper: isWhisper || false,
                        isVideo: isVideo || false,
                        bubbleColor: bubbleColor
                    }));
                    delivered = true;
                } catch (err) {
                    console.log("⚠️ Ghost socket detected. Cleaning up...");
                    bappUsers.delete(cleanTo);
                }
            }

            if (delivered) {
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered (Receipt Sent)");
            } else {
                let db = {};
                try {
                    db = JSON.parse(fs.readFileSync(DB_FILE));
                } catch(e) { console.log("DB was empty or corrupted, creating new."); }
                
                if (!db[cleanTo]) db[cleanTo] = [];
                // CONVERT IMAGE TO FILE BEFORE SAVING TO DB
                let savedText = text;
                if (isImage && text && text.startsWith('data:image')) {
                    savedText = saveImageToFile(text, true);
                }

                db[cleanTo].push({
                    from: from,
                    text: savedText,
                    isImage: isImage || false,
                    isVoice: isVoice || false,
                    isVideo: isVideo || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false,
                    bubbleColor: bubbleColor
                });
                try {
                    const jsonStr = JSON.stringify(db);
                    if (jsonStr.length > 100 * 1024 * 1024) {
                        console.warn("⚠️ Offline DB is over 100MB! Clearing old images...");
                        for (let user in db) {
                            db[user].forEach(m => {
                                if (m.isImage) { m.text = "📷 [Image removed - too large]"; m.isImage = false; }
                            });
                        }
                    }
                    fs.writeFileSync(DB_FILE, JSON.stringify(db));
                    console.log("💾 Offline Saved (" + (JSON.stringify(db).length / 1024).toFixed(1) + " KB)");
                } catch(e) { console.error("❌ Failed to save offline DB:", e); }
            }
        }
    });

    ws.on('close', () => {
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
        }
        for (let [userId, userWs] of bappUsers.entries()) {
            if (userWs === ws) {
                bappUsers.delete(userId);
                console.log(`🔴 Disconnected: ${userId}`);
            }
        }
    });
});
