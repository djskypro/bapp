const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Wait for ACK before deleting)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// A. Remove the early deletion
serverJs = serverJs.replace(
    "                const msgsToSend = db[data.username];\n                delete db[data.username];\n                try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) { console.log(\"Failed to write to offline DB (maybe storage full?):\", e); }",
    "                const msgsToSend = db[data.username];\n                // DO NOT DELETE YET. Wait for sync_ack from client."
);

// B. Add the sync_ack listener to actually delete them
const ackLogic = `
        if (data.type === 'sync_ack') {
            let db = {};
            try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
            if (db[data.username]) {
                delete db[data.username];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("✅ Sync ACK received. Cleared offline DB for " + data.username);
            }
        }
`;
if(!serverJs.includes("data.type === 'sync_ack'")) {
    serverJs = serverJs.replace("if (data.type === 'search_user') {", ackLogic + "\n        if (data.type === 'search_user') {");
}
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Prevent Duplicates on Rapid Refresh)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Add a duplicate check so if the user refreshes fast, they don't get 8 copies of the same message
const oldClientSave = `const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                        savedMsgs.push({`;
                        
const newClientSave = `const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                        
                        // ANTI-DUPLICATE CHECK
                        if (msg.msgId && savedMsgs.some(m => m.msgId === msg.msgId)) {
                            console.log("Skipped duplicate msg:", msg.msgId);
                            continue;
                        }

                        savedMsgs.push({`;

if (html.includes(oldClientSave)) {
    html = html.replace(oldClientSave, newClientSave);
}

fs.writeFileSync('index.html', html);
console.log('✅ True Sync Engine restored! Server will wait for app to save.');
