const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a global variable for the filename at the top of the script
if (!html.includes('let pendingFileName = null;')) {
    html = html.replace('let pendingIsVideo = false;', 'let pendingIsVideo = false;\nlet pendingFileName = null;');
}

// 2. Capture the file name inside handleImageUpload
const oldUploadStart = `function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;`;

const newUploadStart = `function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    pendingFileName = file.name; // <--- SAVE THE REAL NAME HERE`;

html = html.replace(oldUploadStart, newUploadStart);

fs.writeFileSync('index.html', html);
console.log("✅ Original filename is now saved and passed to upload!");
