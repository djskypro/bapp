const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact target string we found in your Termux output
const targetString = `function openChat(id, profileObj) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');`;

// The new version with the reply state reset injected at the top
const replacementString = `function openChat(id, profileObj) {
    // --- FIX: CLEAR PREVIOUS REPLY STATE ---
    const replyBox = document.getElementById('reply-preview');
    if (replyBox) replyBox.style.display = 'none';
    if (typeof currentReplyTo !== 'undefined') window.currentReplyTo = null;
    // ---------------------------------------

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');`;

if (html.includes(targetString)) {
    html = html.replace(targetString, replacementString);
    fs.writeFileSync('index.html', html);
    console.log('✅ Fixed! Reply state now clears when opening a new chat.');
} else {
    // If spacing is slightly off, we use a regex to inject right after the function opening
    const regex = /function openChat\(id, profileObj\) \{/;
    html = html.replace(regex, `function openChat(id, profileObj) {
    const replyBox = document.getElementById('reply-preview');
    if (replyBox) replyBox.style.display = 'none';
    if (typeof currentReplyTo !== 'undefined') window.currentReplyTo = null;`);
    fs.writeFileSync('index.html', html);
    console.log('✅ Fixed via fallback regex!');
}
