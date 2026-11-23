const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Increase the WebSocket payload limit to 50MB
serverJs = serverJs.replace(
    "const wss = new WebSocket.Server({ server });",
    "const wss = new WebSocket.Server({ server, maxPayload: 50 * 1024 * 1024 });"
);

// Ensure status file handling is safe
serverJs = serverJs.replace(
    "let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));",
    "let statuses = [];\n            try { statuses = JSON.parse(fs.readFileSync(STATUSES_FILE)); } catch(e) {}"
);

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server max payload increased to 50MB!');
