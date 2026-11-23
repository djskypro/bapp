const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the send button with the pointerdown trick
const oldBtn = `<div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>`;
const newBtn = `<div class="send-btn" onpointerdown="event.preventDefault(); sendMessage();" id="send-btn" style="display:none;">➤</div>`;
html = html.replace(oldBtn, newBtn);

// 2. Ensure the input instantly refocuses at the end of sendMessage
const targetLine = `input.value = '';`;

// We find the exact line in sendMessage and append a refocus command
// We'll do this safely by only replacing the first instance inside sendMessage
const sendStart = html.indexOf('function sendMessage() {');
const sendEnd = html.indexOf('}', sendStart);
let sendBlock = html.substring(sendStart, sendEnd);

if (sendBlock.includes(targetLine)) {
    sendBlock = sendBlock.replace(targetLine, `input.value = ''; if (document.activeElement !== input) { input.focus(); }`);
    html = html.substring(0, sendStart) + sendBlock + html.substring(sendEnd);
}

fs.writeFileSync('index.html', html);
console.log('✅ Keyboard fixed! Send button uses pointerdown and input refocuses instantly.');
