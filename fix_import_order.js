const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the path.join line and move the mediaDir setup
const oldSetup = `const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

const storage = multer.diskStorage({`;

// We need to remove it from the top and inject it after the imports
serverJs = serverJs.replace(oldSetup, `const storage = multer.diskStorage({`);

// Now find where path and fs are imported, and inject the mediaDir setup after
const importLine = `const path = require('path');`;
if (serverJs.includes(importLine)) {
    serverJs = serverJs.replace(importLine, `const path = require('path');\nconst mediaDir = path.join(__dirname, 'media');\nif (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);`);
} else {
    // Fallback: put it right before app = express()
    serverJs = serverJs.replace("const app = express();", "const mediaDir = path.join(__dirname, 'media');\nif (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);\n\nconst app = express();");
}

fs.writeFileSync('server.js', serverJs);
console.log('✅ Import order fixed!');
