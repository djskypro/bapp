const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldUpload = `        const filename = 'img_' + Date.now() + '.jpg';`;
const newUpload = `        const isVideo = req.file.mimetype.startsWith('video');
        const ext = isVideo ? '.mp4' : '.jpg';
        const prefix = isVideo ? 'vid_' : 'img_';
        const filename = prefix + Date.now() + ext;`;

serverJs = serverJs.replace(oldUpload, newUpload);
fs.writeFileSync('server.js', serverJs);
console.log('✅ Server now saves videos as .mp4!');
