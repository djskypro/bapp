const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the PIN check inside handleSearchInput
const oldCheck = `    // Check if this is a hidden PIN before searching for users
    const hiddenChats = JSON.parse(localStorage.getItem("bapp_hidden_chats")) || {};
    if (Object.values(hiddenChats).includes(query)) {
      return; // Stop here. Do not search for a user. Let the Enter key open it.
    }`;

const newCheck = `    // Check if this is a hidden PIN before searching for users
    const hiddenChats = JSON.parse(localStorage.getItem("bapp_hidden_chats")) || {};
    const isPin = Object.values(hiddenChats).includes(query);
    
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');

    if (isPin && query.length > 0) {
        // It's a PIN! Show the secret button
        dropdown.style.display = 'block';
        dropdown.innerHTML = '<div onclick="openHiddenChatsFromSearch()" style="padding:15px; text-align:center; color:var(--primary); font-weight:bold; cursor:pointer; background:rgba(37,211,102,0.1); border-radius:10px; margin:5px;">🔓 Open Hidden Chats</div>';
        clearBtn.style.display = 'block';
        blurOverlay.style.display = 'block';
        return; // Stop normal search
    }`;

html = html.replace(oldCheck, newCheck);

// 2. Make sure there's only ONE dropdown declaration
html = html.replace(`    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');

    if (query.length === 0) {`, `    if (query.length === 0) {`);

// 3. Add the function to open the hidden chat
const openFunction = `
  function openHiddenChatsFromSearch() {
    const hiddenChats = JSON.parse(localStorage.getItem("bapp_hidden_chats")) || {};
    const chatIds = Object.keys(hiddenChats);
    
    if (chatIds.length > 0) {
      // Let's open the first hidden chat, or you can build a UI to list them all
      document.getElementById('search-input').value = '';
      document.getElementById('search-dropdown').style.display = 'none';
      openChat(chatIds[0]); 
    }
  }
`;

html = html.replace('function handleSearchInput()', openFunction + '\n  function handleSearchInput()');

fs.writeFileSync('index.html', html);
console.log("✅ Secret Portal Button added to search!");
