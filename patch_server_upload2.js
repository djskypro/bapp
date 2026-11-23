const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Add Multer setup
if (!serverJs.includes("require('multer')")) {
    serverJs = serverJs.replace("const express = require('express');", `const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });`);
}

// 2. Add the /upload endpoint
const uploadEndpoint = `
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        const filename = 'img_' + Date.now() + '.jpg';
        const mediaDir = path.join(__dirname, 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
        fs.writeFileSync(path.join(mediaDir, filename), req.file.buffer);
        console.log("📤 Image uploaded:", filename);
        res.json({ url: '/media/' + filename });
    } catch(e) { 
        console.log("Upload error:", e);
        res.status(500).json({ error: 'Upload failed' }); 
    }
});
`;

if (!serverJs.includes("app.post('/upload'")) {
    serverJs = serverJs.replace("app.use(express.static(__dirname));", uploadEndpoint + "\napp.use(express.static(__dirname));");
}

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server upload endpoint added!');
