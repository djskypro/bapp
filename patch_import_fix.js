const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Remove the broken multer block at the top
const brokenTop = `const multer = require('multer');
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

serverJs = serverJs.replace(brokenTop, `const multer = require('multer');`);

// 2. Insert the correct multer setup after all imports (before "const app = express()")
const properBlock = `const mediaDir = path.join(__dirname, 'media');
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
const upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });

`;

if (serverJs.includes('const app = express();') && !serverJs.includes(properBlock)) {
    serverJs = serverJs.replace('const app = express();', properBlock + 'const app = express();');
}

fs.writeFileSync('server.js', serverJs);
console.log('✅ Multer moved after imports!');
