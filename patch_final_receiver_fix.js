const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldSave = `if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                await saveImgToDB(msg.msgId, msg.text);
                                console.log("✅ Offline Image saved to DB:", msg.msgId);
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }`;

const newSave = `if (msg.isImage && !msg.isVideo && msg.msgId) {
                            // If it's a /media/ URL, use it directly
                            if (msg.text.startsWith('/media/') || msg.text.startsWith('http')) {
                                console.log("✅ Offline Image URL used:", msg.text);
                                saveText = msg.text;
                            } else {
                                if (typeof saveImgToDB === 'function') {
                                    await saveImgToDB(msg.msgId, msg.text);
                                }
                                saveText = "img_ref_" + msg.msgId;
                            }
                        }`;

if (html.includes(oldSave)) {
    html = html.replace(oldSave, newSave);
    fs.writeFileSync('index.html', html);
    console.log('✅ Receiver will now use URLs directly!');
} else {
    console.log('❌ Could not find save block');
}
