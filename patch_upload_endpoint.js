const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldEndpoint = `app.post('/upload', upload.single('image'), (req, res) => {
    try {
        const isVideo = req.file.mimetype.startsWith('video');
        const ext = isVideo ? '.mp4' : '.jpg';
        const prefix = isVideo ? 'vid_' : 'img_';
        const filename = prefix + Date.now() + ext;
        const mediaDir = path.join(__dirname, 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
        fs.writeFileSync(path.join(mediaDir, filename), req.file.buffer);
        console.log("📤 Image uploaded:", filename);
        res.json({ url: '/media/' + filename });
    } catch(e) { res.status(500).json({ error: 'Upload failed' }); }
});`;

const newEndpoint = `app.post('/upload', upload.single('image'), (req, res) => {
    try {
        // With diskStorage, req.file.path contains the full file path
        const filename = req.file.filename;
        console.log("📤 File uploaded:", filename);
        res.json({ url: '/media/' + filename });
    } catch(e) { 
        console.log("Upload error:", e);
        res.status(500).json({ error: 'Upload failed' }); 
    }
});`;

if (serverJs.includes(oldEndpoint)) {
    serverJs = serverJs.replace(oldEndpoint, newEndpoint);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Upload endpoint updated to use disk path!');
} else {
    console.log('❌ Could not find the upload endpoint.');
}
