const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add a debug log at the start of sendMessage
const oldStart = `  function sendMessage() {
    const input = document.getElementById('chat-input');`;
const newStart = `  function sendMessage() {
    console.log("GROUPS DB:", JSON.parse(localStorage.getItem('bapp_groups')));
    console.log("ACTIVE CHAT:", activeChatId);
    
    const input = document.getElementById('chat-input');`;

html = html.replace(oldStart, newStart);
fs.writeFileSync('index.html', html);
console.log('✅ Debug logs added!');
