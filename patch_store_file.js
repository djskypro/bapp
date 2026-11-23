const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldCode = `    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        pendingMediaBase64 = URL.createObjectURL(file); // Instant preview, no RAM overload`;

const newCode = `    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        window.pendingVideoFile = file; // <--- STORE THE ACTUAL FILE FOR CHROME
        pendingMediaBase64 = URL.createObjectURL(file); // Instant preview, no RAM overload`;

if (html.includes(oldCode)) {
    html = html.replace(oldCode, newCode);
    fs.writeFileSync('index.html', html);
    console.log('✅ Video file object now stored!');
} else {
    console.log('❌ Could not find the exact block.');
}
