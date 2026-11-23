const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Add Express static serving for the media folder
if (!serverJs.includes("app.use('/media'")) {
    serverJs = serverJs.replace("app.use(express.static(__dirname));", "app.use('/media', express.static(path.join(__dirname, 'media')));\napp.use(express.static(__dirname));");
}

// 2. Create the media folder
if (!fs.existsSync('media')) fs.mkdirSync('media');

// 3. Intercept image saving on the server (both group and single user)
const oldSaveImg = `text: text, isImage: isImage || false, isVoice: isVoice || false, isVideo: isVideo || false,`;
const newSaveImg = `text: saveImageToFile(text, isImage), isImage: isImage || false, isVoice: isVoice || false, isVideo: isVideo || false,`;

// Use a broad replace to catch both group and single user blocks
serverJs = serverJs.split(oldSaveImg).join(newSaveImg);

// 4. Add the file-saving helper function at the top
const saveImageFunc = `
function saveImageToFile(text, isImage) {
    if (!isImage || !text || !text.startsWith('data:image')) return text;
    try {
        const filename = 'img_' + Date.now() + '_' + Math.floor(Math.random()*1000) + '.jpg';
        const base64Data = text.replace(/^data:image\\/\\w+;base64,/, "");
        fs.writeFileSync(path.join(__dirname, 'media', filename), base64Data, 'base64');
        console.log("💾 Saved image file:", filename);
        return '/media/' + filename;
    } catch(e) { 
        console.error("❌ Failed to save image file:", e); 
        return text; // Fallback to base64
    }
}
`;
serverJs = serverJs.replace("const app = express();", saveImageFunc + "\nconst app = express();");

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server now saves images to /media folder!');
