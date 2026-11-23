const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Remove the misplaced lines
serverJs = serverJs.replace("const mediaDir = path.join(__dirname, 'media');\nif (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);\n", "");

// Re-inject right before the app is created (after all imports)
serverJs = serverJs.replace("const app = express();", "const mediaDir = path.join(__dirname, 'media');\nif (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);\n\nconst app = express();");

fs.writeFileSync('server.js', serverJs);
console.log('✅ Fixed import order!');
