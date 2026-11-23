const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace("fileSize: 50 * 1024 * 1024", "fileSize: 500 * 1024 * 1024");
serverJs = serverJs.replace("fileSize: 200 * 1024 * 1024", "fileSize: 500 * 1024 * 1024");
fs.writeFileSync('server.js', serverJs);
console.log('✅ Server limit set to 500MB!');
