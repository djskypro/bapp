const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetLine = `if (data.type === 'new_message') {`;
const popupLogic = `
        // --- TRIGGER POPUP ---
        let popupName = data.from || data.groupId;
        try {
          let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
          if (profiles[popupName] && profiles[popupName].name) popupName = profiles[popupName].name;
        } catch(e) {}
        
        let popupText = data.text || '📷 Media';
        if (typeof popupText === 'string' && (popupText.startsWith('data:') || popupText.startsWith('/media/'))) popupText = '📷 Media';
        
        if (typeof showMessagePopup === 'function') {
          showMessagePopup(popupName, popupText, data.from || data.groupId);
        }
        // ----------------------
`;

// Replace the FIRST occurrence inside the main websocket handler
// (We use replace() which only replaces the first occurrence by default in JS)
html = html.replace(targetLine, targetLine + "\n" + popupLogic);

fs.writeFileSync('index.html', html);
console.log("✅ Popup trigger inserted cleanly!");
