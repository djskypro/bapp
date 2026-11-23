const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact line from your terminal output
const badLine = "setTimeout(() => document.getElementById('chat-input').focus(), 300);";

// Remove it
if (html.includes(badLine)) {
    html = html.replace(badLine, "// Keyboard auto-focus removed");
    fs.writeFileSync('index.html', html);
    console.log('✅ Keyboard will no longer pop up automatically when opening a chat!');
} else {
    console.log('❌ Could not find the exact focus line.');
}
