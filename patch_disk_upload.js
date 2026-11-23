const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Replace the memoryStorage line with diskStorage
const oldUpload = `const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });`;

const newUpload = `const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, mediaDir);
    },
    filename: function (req, file, cb) {
        const isVideo = file.mimetype.startsWith('video');
        const ext = isVideo ? '.mp4' : '.jpg';
        const prefix = isVideo ? 'vid_' : 'img_';
        cb(null, prefix + Date.now() + ext);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });`;

if (serverJs.includes(oldUpload)) {
    serverJs = serverJs.replace(oldUpload, newUpload);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Multer is now writing directly to disk. No more RAM crash!');
} else {
    console.log('❌ Could not find the multer setup line.');
}
