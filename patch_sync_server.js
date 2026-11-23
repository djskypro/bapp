const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Stop deleting immediately
serverJs = serverJs.replace(
    "delete db[data.username];\n                try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch(e) {}",
    "// Don't delete yet. Wait for sync_ack."
);

// 2. Listen for the ACK to delete
const ackLogic = `
        if (data.type === 'sync_ack') {
            const db = JSON.parse(fs.readFileSync(DB_FILE));
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
console.log('✅ Server Sync Engine ready!');
