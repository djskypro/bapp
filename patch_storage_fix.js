const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the Compression (Lines 1859-1866 from your output)
const oldCompression = `        const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Img = canvas.toDataURL('image/jpeg', 0.6);`;

const newCompression = `        const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Img = canvas.toDataURL('image/jpeg', 0.4);`;

if (html.includes(oldCompression)) {
    html = html.replace(oldCompression, newCompression);
} else {
    console.log("❌ Compression block not found.");
}

// 2. Fix the Storage Full Error in confirmMediaSend
const oldStorageSave = `    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();

        // Force clear the reply box
        document.getElementById('reply-preview').style.display = 'none';
        currentReplyTo = null;
        if (window.replyState) delete window.replyState[to];
        loadChatList();
    } catch(err) { alert("Phone memory is full!"); }`;

const newStorageSave = `    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();

        document.getElementById('reply-preview').style.display = 'none';
        currentReplyTo = null;
        if (window.replyState) delete window.replyState[to];
    } catch(err) { 
        // AUTO-CLEANUP: Delete old images from all chats to free up space
        console.warn("Storage full! Clearing old images...");
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith('bapp_msgs_')) {
                let msgs = JSON.parse(localStorage.getItem(key)) || [];
                let changed = false;
                msgs.forEach(m => {
                    // Find images and clear their data to free space
                    if (m.isImage && m.text && m.text.startsWith('data:image')) {
                        m.text = "📷 [Image removed to save space]";
                        m.isImage = false;
                        changed = true;
                    }
                });
                if (changed) localStorage.setItem(key, JSON.stringify(msgs));
            }
        }
        // Try saving the new image again
        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e2) { alert("Phone storage is completely full."); }
    }`;

if (html.includes(oldStorageSave)) {
    html = html.replace(oldStorageSave, newStorageSave);
} else {
    console.log("❌ Storage save block not found. Trying fallback...");
    // Fallback if spacing is slightly different
    const fallbackRegex = /try \{\s*const savedMsgs = JSON\.parse\(localStorage\.getItem\('bapp_msgs_' \+ to\)\) \|\| \[\];\s*savedMsgs\.push\(\{ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' \}\);\s*localStorage\.setItem\('bapp_msgs_' \+ to, JSON\.stringify\(savedMsgs\)\);[\s\S]*?\} catch\(err\) \{ alert\("Phone memory is full!"\); \}/;
    html = html.replace(fallbackRegex, newStorageSave);
}

fs.writeFileSync('index.html', html);
console.log('✅ Aggressive compression and storage auto-cleanup applied!');
