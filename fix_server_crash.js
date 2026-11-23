const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the exact block that causes the crash
const oldBlock = /if \(status && !status\.views\.includes\(data\.viewer\)\) \{\s*status\.views\.push\(data\.viewer\);\s*fs\.writeFileSync\(STATUSES_FILE, JSON\.stringify\(statuses\)\);\s*\}/g;

// Replace it with a safe version that creates the array if it's missing
const newBlock = `if (status) {
                if (!status.views) status.views = []; // Fix for old statuses
                if (!status.views.includes(data.viewer)) {
                    status.views.push(data.viewer);
                    fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
                }
            }`;

if (serverJs.match(oldBlock)) {
    serverJs = serverJs.replace(oldBlock, newBlock);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server crash fixed! Old statuses will no longer break the app.');
} else {
    console.log('⚠️ Could not find the exact block. Let me try a manual replacement.');
    // Fallback if exact match fails
    serverJs = serverJs.replace(
        "if (status && !status.views.includes(data.viewer)) {",
        "if (status) { if (!status.views) status.views = []; if (!status.views.includes(data.viewer)) {"
    );
    // Need to add an extra closing brace for the new 'if (status)'
    serverJs = serverJs.replace(
        "fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));\n            }",
        "fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));\n            }\n            }"
    );
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server patched via fallback.');
}
