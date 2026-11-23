const fs = require('fs');

// ==========================================
// 1. INCREASE SERVER LIMIT TO 150MB
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Change the maxPayload to 150MB to allow the 133MB base64 string to pass
serverJs = serverJs.replace(
    "const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 * 1024 });",
    "const wss = new WebSocket.Server({ server, maxPayload: 150 * 1024 * 1024 });"
);
// Fallback if the above line was slightly different
serverJs = serverJs.replace(
    "const wss = new WebSocket.Server({ server });",
    "const wss = new WebSocket.Server({ server, maxPayload: 150 * 1024 * 1024 });"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. INCREASE CLIENT LIMIT TO 100MB
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Change the 10MB check in the video upload logic to 100MB
html = html.replace(
    "if (file.size > 10 * 1024 * 1024) {",
    "if (file.size > 100 * 1024 * 1024) {"
);

// Change the error message
html = html.replace(
    "alert(\"Video is too large! Please select a video under 10MB.\");",
    "alert(\"Video is too large! Please select a video under 100MB.\");"
);

fs.writeFileSync('index.html', html);
console.log('✅ Video limits increased to 100MB!');
