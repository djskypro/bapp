const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix goBack() to clear the reply when leaving the chat
const oldGoBack = `function goBack() {
    showNav();`;
const newGoBack = `function goBack() {
    showNav();
    if (typeof cancelReply === 'function') cancelReply(); // Hide reply preview`;
html = html.replace(oldGoBack, newGoBack);

// 2. Fix openChat() to clear any old reply when opening a new chat
const oldOpenChat = `function openChat(id, profileObj) {
    hideNav();`;
const newOpenChat = `function openChat(id, profileObj) {
    hideNav();
    if (typeof cancelReply === 'function') cancelReply(); // Reset reply state`;
html = html.replace(oldOpenChat, newOpenChat);

// 3. Extra safety: Make sure the reply preview is hidden by default
const cssFix = `
<style>
  #reply-preview {
    display: none; /* Force hidden by default */
  }
</style>
</head>
`;
if(!html.includes('#reply-preview {\n    display: none; /* Force hidden by default */')) {
    html = html.replace('</head>', cssFix);
}

fs.writeFileSync('index.html', html);
console.log('✅ Reply preview glitch fixed! It will now disappear when you leave the chat.');
