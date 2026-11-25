const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Check if the bappUsers.set line already exists
if (!serverJs.includes('bappUsers.set(uname, ws);')) {
    const oldBlock = `            if (uname) {
                const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE) || "{}") : {};`;
    
    const newBlock = `            if (uname) {
                bappUsers.set(uname, ws);
                const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE) || "{}") : {};`;
    
    if (serverJs.includes(oldBlock)) {
        serverJs = serverJs.replace(oldBlock, newBlock);
        fs.writeFileSync('server.js', serverJs);
        console.log('✅ Added bappUsers.set line!');
    } else {
        console.log('⚠️ The block was already modified or looks different.');
    }
} else {
    console.log('✅ bappUsers.set already exists.');
}

// Now push to GitHub
const { execSync } = require('child_process');
try {
    execSync('git add server.js', { stdio: 'inherit' });
    execSync('git commit -m "Fix: Add user to online map for live delivery"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Pushed to GitHub! Render will redeploy in 2 minutes.');
} catch (e) {
    console.log('❌ Git push failed. You might need to pull first or check credentials.');
}
