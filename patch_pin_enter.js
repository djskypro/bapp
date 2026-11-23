const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const pinCheckLogic = `
  function checkHiddenPin() {
    const input = document.getElementById('search-input');
    const typedPin = input.value.trim();
    if (!typedPin) return;

    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    
    // Find the chat ID that matches this PIN
    let foundChatId = null;
    for (const chatId in hiddenChats) {
      if (hiddenChats[chatId] === typedPin) {
        foundChatId = chatId;
        break;
      }
    }

    if (foundChatId) {
      // Open the chat immediately!
      input.value = ''; // Clear search
      document.getElementById('search-dropdown').style.display = 'none'; // Hide dropdown
      openChat(foundChatId); // Open the chat
    }
  }
`;

// Insert the function right before handleSearchInput
if (!html.includes('function checkHiddenPin')) {
    html = html.replace('function handleSearchInput', pinCheckLogic + '\n  function handleSearchInput');
    fs.writeFileSync('index.html', html);
    console.log("✅ PIN Enter listener added!");
}
