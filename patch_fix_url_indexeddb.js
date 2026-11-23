const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the offline receiver to NOT save URLs to IndexedDB
const oldSave = `                        if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                await saveImgToDB(msg.msgId, msg.text);
                                console.log("✅ Offline Image saved to DB:", msg.msgId);
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }`;

const newSave = `                        if (msg.isImage && !msg.isVideo && msg.msgId) {
                            // If it's a URL from the server, use it directly
                            if (msg.text.startsWith('/media/') || msg.text.startsWith('http')) {
                                console.log("✅ Offline Image URL received:", msg.text);
                                saveText = msg.text;
                            } else {
                                // Fallback for old Base64 images
                                if (typeof saveImgToDB === 'function') {
                                    await saveImgToDB(msg.msgId, msg.text);
                                }
                                saveText = "img_ref_" + msg.msgId;
                            }
                        }`;

if (html.includes(oldSave)) {
    html = html.replace(oldSave, newSave);
    fs.writeFileSync('index.html', html);
    console.log('✅ Receiver will now use URLs directly instead of IndexedDB!');
} else {
    console.log('❌ Could not find the exact save block.');
}
