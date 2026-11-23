const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldStorage = `const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, mediaDir),
    filename: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video');
        const ext = isVideo ? '.mp4' : '.jpg';
        const prefix = isVideo ? 'vid_' : 'img_';
        cb(null, prefix + Date.now() + ext);
    }
});`;

const newStorage = `const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, mediaDir),
    filename: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video');
        
        // Get the original extension from the uploaded file name
        const originalExt = file.originalname.split('.').pop().toLowerCase();
        const ext = '.' + originalExt; 
        
        const prefix = isVideo ? 'vid_' : 'img_';
        cb(null, prefix + Date.now() + ext);
    }
});`;

if (serverJs.includes(oldStorage)) {
    serverJs = serverJs.replace(oldStorage, newStorage);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server fixed to preserve original video extensions!");
} else {
    console.log("❌ Could not find the multer storage block.");
}
