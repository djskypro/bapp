const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Revert the send button back to its normal, working state
const brokenBtn = `<div class="send-btn" onclick="sendMessage()" onmousedown="event.preventDefault();" ontouchstart="event.preventDefault();" id="send-btn" style="display:none;">➤</div>`;
const workingBtn = `<div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>`;
html = html.replace(brokenBtn, workingBtn);

// 2. Fix the focus logic. Instead of forcing it immediately (which gets overridden), 
// we use a tiny delay to snap it back open right after the click registers.
const oldFocusFix = `input.value = ''; 
    const chatIn = document.getElementById('chat-input');
    if (chatIn && document.activeElement !== chatIn) {
        // Only focus if we are in the chat view
        const chatView = document.getElementById('chat-view');
        if(chatView && chatView.classList.contains('active')) chatIn.focus();
    }`;

const newFocusFix = `input.value = ''; 
    // Snap the keyboard back open instantly after sending
    setTimeout(() => {
        const chatIn = document.getElementById('chat-input');
        const chatView = document.getElementById('chat-view');
        if (chatIn && chatView && chatView.classList.contains('active')) {
            chatIn.focus();
        }
    }, 10);`;

html = html.replace(/input\.value = ''; \n    const chatIn = document\.getElementById\('chat-input'\);[\s\S]*?chatIn\.focus\(\);\n    \}/g, newFocusFix);
// Fallback regex just in case
html = html.replace(oldFocusFix, newFocusFix);

fs.writeFileSync('index.html', html);
console.log('✅ Send button fixed and keyboard auto-snap applied!');
