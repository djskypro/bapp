const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the start of the local message search block
const startMarker = "    // 2. Search Local Messages";
const endMarker = "    if (resultHTML !== '') {";

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newSearchBlock = `    // 2. Search ENTIRE LocalStorage for Messages
    let resultHTML = '';
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    // Loop through every key in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('bapp_msgs_')) {
        const chatId = key.replace('bapp_msgs_', '');
        
        // Skip hidden chats
        if (hiddenChats[chatId]) continue;

        let msgs = [];
        try { msgs = JSON.parse(localStorage.getItem(key)) || []; } catch(e) {}
        
        const name = profiles[chatId] ? (profiles[chatId].name || chatId) : chatId;

        // Find any message that contains the query
        const matchingMsgs = msgs.filter(m => m.text && !m.text.startsWith('data:') && m.text.toLowerCase().includes(query));

        if (matchingMsgs.length > 0) {
          // Show the most recent matching message
          const bestMatch = matchingMsgs[matchingMsgs.length - 1];
          
          resultHTML += \`
            <div onclick="document.getElementById('search-dropdown').style.display='none'; document.getElementById('search-input').value=''; openChat('\\\${chatId}')" style="padding:12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:4px;">
              <div style="font-weight:bold; color:var(--primary); font-size:14px;">\\\${name}</div>
              <div style="color:#ccc; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">...\\\${bestMatch.text}...</div>
            </div>
          \`;
        }
      }
    }

`;

    html = html.slice(0, startIndex) + newSearchBlock + html.slice(endIndex);
    fs.writeFileSync('index.html', html);
    console.log("✅ Global search engine installed! It now scans everything.");
} else {
    console.log("❌ Could not find the search block markers. Let's check the code.");
}
