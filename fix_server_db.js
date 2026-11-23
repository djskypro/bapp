const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldSave = `                fs.writeFileSync(DB_FILE, JSON.stringify(db));
                console.log("💾 Offline Saved");`;

const newSave = `                try {
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
                } catch(e) { console.error("❌ Failed to save offline DB:", e); }`;

if (serverJs.includes(oldSave)) {
    serverJs = serverJs.replace(oldSave, newSave);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server DB save patched!');
} else {
    console.log('❌ Could not find the exact DB save block.');
}
