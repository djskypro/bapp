const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Move the save tracker to the VERY TOP of sendMessage
const oldSendStart = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;`;

const newSendStart = `  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    // --- FORCE SAVE TO TRACKER FIRST ---
    const earlyMsgId = Date.now().toString();
    try {
        localStorage.setItem('bapp_last_sent', JSON.stringify({ to: activeChatId, msgId: earlyMsgId, time: Date.now() }));
        if (typeof showToast === 'function') showToast("📝 Message saved for Undo!");
    } catch(e) {
        alert("⚠️ Storage Full! Cannot track message for Undo.");
    }
    // -----------------------------------`;

// Replace the start of sendMessage
if (html.includes(oldSendStart)) {
    html = html.replace(oldSendStart, newSendStart);
} else {
    // Fallback if spacing is different
    html = html.replace("function sendMessage() {", newSendStart);
}

// 2. Update the debug toast inside the shake listener to show exactly what is saved
const oldShakeDebug = `if (typeof showToast === 'function') showToast("Shake! DB: " + debugData);`;
const newShakeDebug = `alert("Shaking! Looking for: " + debugData);`;

if (html.includes(oldShakeDebug)) {
    html = html.replace(oldShakeDebug, newShakeDebug);
}

fs.writeFileSync('index.html', html);
console.log('✅ Ultimate Undo tracker applied!');
