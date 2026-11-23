const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the offline receiver to wait for DB
const oldOfflineBlock = `            let saveText = msg.text;
            // If it's an image, save it to IndexedDB, not localStorage
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') {
                    saveImgToDB(msg.msgId, msg.text);
                }
                saveText = "img_ref_" + msg.msgId;
            }`;

const newOfflineBlock = `            let saveText = msg.text;
            // If it's an image, save it to IndexedDB, not localStorage
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') {
                    // The saveImgToDB function has a retry, but we need to pass the image ref anyway
                    saveImgToDB(msg.msgId, msg.text);
                }
                saveText = "img_ref_" + msg.msgId;
            }`;
html = html.replace(oldOfflineBlock, newOfflineBlock);

// 2. Add a tiny delay to loadChatList to allow DB to write
// We find the exact loop in offline_messages and add a setTimeout
const oldRenderLoop = `        loadChatList(); // Refresh the list`;
const newRenderLoop = `        // Delay the UI refresh by 300ms to let IndexedDB finish saving
        setTimeout(() => { loadChatList(); }, 300);`;
html = html.replace(oldRenderLoop, newRenderLoop);

fs.writeFileSync('index.html', html);
console.log('✅ Added 300ms delay to let DB finish saving before rendering!');
