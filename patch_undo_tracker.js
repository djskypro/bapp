const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the tracker to the very top of sendMessage
const oldMsgId = `const msgId = Date.now().toString();`;
const newMsgId = `const msgId = Date.now().toString();
    
    // TRACK FOR SHAKE TO UNDO
    window.lastSentMessage = { to: activeChatId, msgId: msgId };
    console.log("Tracker set:", window.lastSentMessage);`;

// We only want to replace the FIRST instance, which is inside sendMessage
const sendStart = html.indexOf('function sendMessage() {');
const sendEnd = html.indexOf('const isConnected', sendStart);
let sendBlock = html.substring(sendStart, sendEnd);
sendBlock = sendBlock.replace(oldMsgId, newMsgId);
html = html.substring(0, sendStart) + sendBlock + html.substring(sendEnd);

// 2. Add a debug alert to the shake listener
const oldShakeCheck = `if (window.enableShakeToUndo) {
          if (window.lastSentMessage && window.lastSentMessage.msgId) {`;
const newShakeCheck = `if (window.enableShakeToUndo) {
          // DEBUG: Show what is in memory when shaking
          alert("Shake detected! Tracker says: " + JSON.stringify(window.lastSentMessage));
          
          if (window.lastSentMessage && window.lastSentMessage.msgId) {`;
html = html.replace(oldShakeCheck, newShakeCheck);

fs.writeFileSync('index.html', html);
console.log('✅ Tracker moved to top and debug alert added.');
