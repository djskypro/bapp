const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldLine = `        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();`;
const newLine = `        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();
        
        // --- TRIGGER INCOMING POPUP ---
        let senderName = senderId;
        try {
          let p = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
          if (p[senderId] && p[senderId].name) senderName = p[senderId].name;
        } catch(e) {}
        
        let popupMsg = data.text || '📷 Media';
        if (typeof popupMsg === 'string' && popupMsg.startsWith('data:')) popupMsg = '📷 Media';
        if (typeof popupMsg === 'string' && popupMsg.startsWith('/media/')) popupMsg = '📷 Media';
        
        if (typeof showMessagePopup === 'function') {
          showMessagePopup(senderName, popupMsg, senderId);
        }
        // ------------------------------`;

if (html.includes(oldLine)) {
    html = html.replace(oldLine, newLine);
    fs.writeFileSync('index.html', html);
    console.log("✅ Popup trigger added inside WebSocket!");
} else {
    console.log("❌ Could not find the senderId line.");
}
