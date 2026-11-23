const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a Toast to sendMessage to PROVE it saves
const oldSendTracker = `localStorage.setItem('bapp_last_sent', JSON.stringify({ to: activeChatId, msgId: msgId, time: Date.now() }));`;
const newSendTracker = `localStorage.setItem('bapp_last_sent', JSON.stringify({ to: activeChatId, msgId: msgId, time: Date.now() }));
    if (typeof showToast === 'function') showToast("📝 Message tracked for Undo!");`;

if (html.includes(oldSendTracker)) {
    html = html.replace(oldSendTracker, newSendTracker);
}

// 2. Add a Debug Alert to the Shake Listener
const oldShakeStart = `if (window.enableShakeToUndo) {`;
const newShakeStart = `if (window.enableShakeToUndo) {
          const debugData = localStorage.getItem('bapp_last_sent');
          if (typeof showToast === 'function') showToast("Shake! DB: " + debugData);`;

// We only want to replace the FIRST instance inside the shake listener
const shakeIdx = html.indexOf("window.addEventListener('devicemotion'");
if (shakeIdx !== -1) {
    const shakeBlock = html.substring(shakeIdx, shakeIdx + 1500);
    const newShakeBlock = shakeBlock.replace(oldShakeStart, newShakeStart);
    html = html.substring(0, shakeIdx) + newShakeBlock + html.substring(shakeIdx + 1500);
}

fs.writeFileSync('index.html', html);
console.log('✅ Debug Toasts added!');
