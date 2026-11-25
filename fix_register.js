const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldBlock = `if (uname) {
                const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE) || "{}") : {};`;

const newBlock = `if (uname) {
                bappUsers.set(uname, ws);
                const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE) || "{}") : {};`;

if (serverJs.includes(oldBlock)) {
    serverJs = serverJs.replace(oldBlock, newBlock);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Added missing bappUsers.set line!');
} else {
    console.log('❌ Could not find the block.');
}
