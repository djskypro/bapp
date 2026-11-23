const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the sender's payload
const oldPayload = `isImage: !isVid,
            isVideo: isVid,`;
const newPayload = `isImage: true,
            isVideo: isVid,`;

if (html.includes(oldPayload)) {
    html = html.replace(oldPayload, newPayload);
    fs.writeFileSync('index.html', html);
    console.log('✅ Sender now sends isImage: true for all media!');
} else {
    console.log('❌ Could not find the payload block.');
}
