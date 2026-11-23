const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Remove the instant delete from register_user
const oldDelivery = `            const db = JSON.parse(fs.readFileSync(DB_FILE));
            if (db[data.username] && db[data.username].length > 0) {
                const msgsToSend = db[data.username];
                delete db[data.username];
                try {
                    fs.writeFileSync(DB_FILE, JSON.stringify(db));`;
                    
const newDelivery = `            const db = JSON.parse(fs.readFileSync(DB_FILE));
            if (db[data.username] && db[data.username].length > 0) {
                const msgsToSend = db[data.username];
                // DO NOT DELETE. Wait for sync_ack.
                try {`;
                
serverJs = serverJs.replace(oldDelivery, newDelivery);

// 2. Add the sync_ack listener and the 5-minute cleanup timer
const ackAndCleanup = `
        if (data.type === 'sync_ack') {
            let db = {};
            try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
            if (db[data.username]) {
                delete db[data.username];
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("✅ Sync ACK received. Cleared offline DB for " + data.username);
            }
        }

        // 5-MINUTE AUTO CLEANUP
        // When the user registers, set a timer to delete messages if they don't ACK in 5 minutes
        if (data.type === 'register_user') {
            setTimeout(() => {
                let db = {};
                try { db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e) {}
                if (db[data.username] && db[data.username].length > 0) {
                    delete db[data.username];
                    fs.writeFileSync(DB_FILE, JSON.stringify(db));
                    console.log("⏰ 5-Minute Cleanup: Cleared unconfirmed messages for " + data.username);
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
`;

if(!serverJs.includes("data.type === 'sync_ack'")) {
    serverJs = serverJs.replace("if (data.type === 'search_user') {", ackAndCleanup + "\n        if (data.type === 'search_user') {");
}

fs.writeFileSync('server.js', serverJs);
console.log('✅ Sync ACK restored and 5-minute auto-cleanup added!');
