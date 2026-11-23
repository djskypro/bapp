const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Fix the multer setup: use diskStorage, 500MB limit, correct extensions
const oldMulter = `const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });`;

const newMulter = `const multer = require('multer');
const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, mediaDir),
    filename: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video');
        const ext = isVideo ? '.mp4' : '.jpg';
        const prefix = isVideo ? 'vid_' : 'img_';
        cb(null, prefix + Date.now() + ext);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });`;

serverJs = serverJs.replace(oldMulter, newMulter);

// 2. Fix the upload endpoint to use disk file
const oldEndpoint = `app.post('/upload', upload.single('image'), (req, res) => {
    try {
        const filename = 'img_' + Date.now() + '.jpg';
        const mediaDir = path.join(__dirname, 'media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
        fs.writeFileSync(path.join(mediaDir, filename), req.file.buffer);
        console.log("📤 Image uploaded:", filename);
        res.json({ url: '/media/' + filename });
    } catch(e) { res.status(500).json({ error: 'Upload failed' }); }
});`;

const newEndpoint = `app.post('/upload', upload.single('image'), (req, res) => {
    try {
        console.log("📤 File uploaded:", req.file.filename);
        res.json({ url: '/media/' + req.file.filename });
    } catch(e) { 
        console.log("Upload error:", e);
        res.status(500).json({ error: 'Upload failed' }); 
    }
});`;

serverJs = serverJs.replace(oldEndpoint, newEndpoint);

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server fixed: diskStorage, 500MB limit, proper extensions!');
