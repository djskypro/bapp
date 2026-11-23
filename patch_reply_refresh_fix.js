const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add inline style="display: none;" to the HTML so it NEVER shows on load
const oldHTML = `<div id="reply-preview">`;
const newHTML = `<div id="reply-preview" style="display: none;">`;
html = html.replace(oldHTML, newHTML);

// 2. Add display: none; to the CSS just in case the inline style gets overridden
const oldCSS = `  #reply-preview {
    position: absolute !important;`;
const newCSS = `  #reply-preview {
    display: none;
    position: absolute !important;`;
html = html.replace(oldCSS, newCSS);

// 3. Force it to hide when a chat opens (unless there is an active reply)
const oldOpenChat = `    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');`;
    
const newOpenChat = `    // FORCE HIDE REPLY BOX ON CHAT OPEN
    const rpBox = document.getElementById('reply-preview');
    if (rpBox && !currentReplyTo) rpBox.style.display = 'none';

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');`;

html = html.replace(oldOpenChat, newOpenChat);

fs.writeFileSync('index.html', html);
console.log('✅ Reply box will now stay hidden on refresh!');
