const fs = require('fs');

// ==========================================
// 1. FIX THE SERVER (Force it to forward the isVoice flag)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerSend = `if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}]\`);

            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage, isVoice: isVoice }));
                console.log("✅ Delivered");
            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({ from: from, text: text, isImage: isImage, isVoice: isVoice });
                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Offline Saved");
            }
        }`;

const newServerSend = `if (data.type === 'send_message') {
            const { to, from, text, isImage, isVoice } = data;
            const cleanTo = to.trim();
            
            console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isVoice: \${isVoice}\`);

            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ 
                    type: 'new_message', 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false 
                }));
                console.log("✅ Delivered");
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
        }`;

// If the exact block isn't found, we use a regex to replace the logic safely
if (serverJs.includes(oldServerSend)) {
    serverJs = serverJs.replace(oldServerSend, newServerSend);
} else {
    // Fallback replacement using regex
    serverJs = serverJs.replace(/if \(data\.type === 'send_message'\) \{[\s\S]*?console\.log\("💾 Offline Saved"\);\s*\}/, newServerSend);
}
fs.writeFileSync('server.js', serverJs);


// ==========================================
// 2. FIX THE CLIENT (Auto-detect audio strings)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// We add a fallback check: if the text starts with 'data:audio', it's a voice note!
const oldAppendLogic = `    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      // If you add the full screen viewer later, put it here
      newMsg.appendChild(img);
    } else if (isVoice) {`;

const newAppendLogic = `    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      newMsg.appendChild(img);
    } else if (isVoice || (text && text.startsWith('data:audio'))) {`;

html = html.replace(oldAppendLogic, newAppendLogic);

fs.writeFileSync('index.html', html);
console.log('✅ Server and Client patched. Audio strings will now always render as players!');
