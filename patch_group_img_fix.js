const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `        let saveText = data.text;
        if (data.isImage && !data.isVideo) {
            saveImgToDB(data.msgId, data.text);
            saveText = "img_ref_" + data.msgId;
        }`;

const newBlock = `        let saveText = data.text;
        if (data.isImage && !data.isVideo) {
            // If it's a URL from the server, use it directly!
            if (data.text.startsWith('/media/') || data.text.startsWith('http')) {
                saveText = data.text;
            } else {
                saveImgToDB(data.msgId, data.text);
                saveText = "img_ref_" + data.msgId;
            }
        }`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Online receiver fixed to use media URLs!');
} else {
    console.log('❌ Could not find the exact block.');
}
