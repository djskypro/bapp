const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Increase from 50MB to 500MB
serverJs = serverJs.replace(
    "limits: { fileSize: 50 * 1024 * 1024 }",
    "limits: { fileSize: 500 * 1024 * 1024 }"
);

fs.writeFileSync('server.js', serverJs);
console.log('✅ Upload limit increased to 500MB!');
