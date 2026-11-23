const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We need to store the actual File object, not just the blob URL
const oldVideoCheck = `    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        pendingMediaBase64 = URL.createObjectURL(file); // Instant preview, no memory overload`;

const newVideoCheck = `    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        window.pendingVideoFile = file; // STORE THE ACTUAL FILE
        pendingMediaBase64 = URL.createObjectURL(file);`;

if (html.includes(oldVideoCheck)) {
    html = html.replace(oldVideoCheck, newVideoCheck);
}

// Now update confirmMediaSend to use the stored file directly
const oldUpload = `        // 1. Upload the file to the server
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        const isVid = pendingIsVideo;
        const filename = (isVid ? 'video_' : 'image_') + Date.now() + (isVid ? '.mp4' : '.jpg');
        formData.append('image', blob, filename);`;

const newUpload = `        // 1. Upload the file to the server
        let blob;
        if (pendingIsVideo && window.pendingVideoFile) {
            blob = window.pendingVideoFile; // Use the real file object for videos
        } else {
            blob = await (await fetch(pendingMediaBase64)).blob();
        }
        
        const formData = new FormData();
        const isVid = pendingIsVideo;
        const filename = (isVid ? 'video_' : 'image_') + Date.now() + (isVid ? '.mp4' : '.jpg');
        formData.append('image', blob, filename);`;

if (html.includes(oldUpload)) {
    html = html.replace(oldUpload, newUpload);
    console.log('✅ Upload now uses the real File object for videos!');
} else {
    console.log('❌ Could not find the upload block.');
}

// Clear the stored file after sending
const oldClear = `        pendingMediaBase64 = null;`;
const newClear = `        pendingMediaBase64 = null;
        window.pendingVideoFile = null;`;

if (html.includes(oldClear)) {
    html = html.replace(oldClear, newClear);
}

fs.writeFileSync('index.html', html);
console.log('✅ Google Files fix applied!');
