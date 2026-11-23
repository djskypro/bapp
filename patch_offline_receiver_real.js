const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We use a regex to find the exact offline save block, no matter the spacing
const offlineRegex = /try \{\s*const savedMsgs = JSON\.parse\(localStorage\.getItem\('bapp_msgs_' \+ senderId\)\) \|\| \[\];\s*\/\/ SAVE ALL MEDIA TYPES AND REPLIES\s*savedMsgs\.push\(\{[\s\S]*?localStorage\.setItem\('bapp_msgs_' \+ senderId, JSON\.stringify\(savedMsgs\)\);\s*\} catch\(e\) \{ console\.error\("Storage full"\); \}/;

const newOfflineBlock = `try {
            let saveText = msg.text;
            // If it's an image, save it to IndexedDB, not localStorage
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') {
                    saveImgToDB(msg.msgId, msg.text);
                }
                saveText = "img_ref_" + msg.msgId;
            }

            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            savedMsgs.push({
                text: saveText,
                type: 'received',
                time: now,
                isImage: msg.isImage,
                isVoice: msg.isVoice,
                msgId: msg.msgId,
                replyData: msg.replyData,
                isWhisper: msg.isWhisper,
                isVideo: msg.isVideo,
                bubbleColor: msg.bubbleColor
            });
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e) { console.error("Storage full", e); }`;

if (html.match(offlineRegex)) {
    html = html.replace(offlineRegex, newOfflineBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Offline images will now save to IndexedDB and NOT localStorage!');
} else {
    // Fallback if regex fails
    const oldBlock = `            savedMsgs.push({
                text: msg.text,
                type: 'received',
                time: now,
                isImage: msg.isImage,
                isVoice: msg.isVoice,
                msgId: msg.msgId,
                replyData: msg.replyData
            });`;
            
    const newBlock = `            let saveText = msg.text;
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') saveImgToDB(msg.msgId, msg.text);
                saveText = "img_ref_" + msg.msgId;
            }
            savedMsgs.push({
                text: saveText,
                type: 'received',
                time: now,
                isImage: msg.isImage,
                isVoice: msg.isVoice,
                msgId: msg.msgId,
                replyData: msg.replyData,
                isWhisper: msg.isWhisper,
                isVideo: msg.isVideo,
                bubbleColor: msg.bubbleColor
            });`;
            
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Fixed via fallback!');
}
