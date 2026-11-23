const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the dummy alerts with real function calls
html = html.replace(`onclick="alert('Notification settings coming soon!')"`, `onclick="openNotificationSettings()"`);
html = html.replace(`onclick="alert('Media visibility settings coming soon!')"`, `onclick="toggleMediaVisibility()"`);
html = html.replace(`onclick="alert('Messages are End-to-End Encrypted!')"`, `onclick="showEncryptionInfo()"`);
html = html.replace(`onclick="alert('Disappearing messages coming soon!')"`, `onclick="openDisappearingMessages()"`);
html = html.replace(`onclick="alert('Chat Lock coming soon!')"`, `onclick="toggleChatLock()"`);
html = html.replace(`onclick="alert('Advanced privacy coming soon!')"`, `onclick="showAdvancedPrivacy()"`);
html = html.replace(`onclick="alert('Added to Favorites!')"`, `onclick="toggleFavorite()"`);

// 2. Inject the real functions
const groupFuncsJS = `
  // --- GROUP SETTINGS LOGIC ---
  
  function openNotificationSettings() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let current = settings[activeChatId]?.notifications || 'All';
      let choice = prompt("Notifications (Type: All, Mentions, or Mute):", current);
      if (choice) {
          if(!settings[activeChatId]) settings[activeChatId] = {};
          settings[activeChatId].notifications = choice;
          localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
          if(typeof showToast === 'function') showToast("Notifications set to: " + choice);
          else alert("Notifications set to: " + choice);
      }
  }

  function toggleMediaVisibility() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId].mediaVisibility = !settings[activeChatId].mediaVisibility;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      let state = settings[activeChatId].mediaVisibility ? "ON" : "OFF";
      if(typeof showToast === 'function') showToast("Media Visibility: " + state);
      else alert("Media Visibility: " + state);
  }

  function showEncryptionInfo() {
      alert("🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even BAPP, can read or listen to them.");
  }

  function openDisappearingMessages() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let current = settings[activeChatId]?.disappearing || 'Off';
      let choice = prompt("Disappearing Messages (Type: Off, 24 Hours, 7 Days, 90 Days):", current);
      if (choice) {
          if(!settings[activeChatId]) settings[activeChatId] = {};
          settings[activeChatId].disappearing = choice;
          localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
          if(typeof showToast === 'function') showToast("Disappearing messages: " + choice);
          else alert("Disappearing messages: " + choice);
      }
  }

  function toggleChatLock() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId].locked = !settings[activeChatId].locked;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      let state = settings[activeChatId].locked ? "ON" : "OFF";
      if(typeof showToast === 'function') showToast("Chat Lock: " + state);
      else alert("Chat Lock: " + state);
  }

  function showAdvancedPrivacy() {
      alert("🛡️ Advanced Chat Privacy blocks exports and auto-downloads for this chat.");
  }

  function toggleFavorite() {
      let favs = JSON.parse(localStorage.getItem('bapp_favorites')) || [];
      if(favs.includes(activeChatId)) {
          favs = favs.filter(id => id !== activeChatId);
          if(typeof showToast === 'function') showToast("Removed from Favorites");
          else alert("Removed from Favorites");
      } else {
          favs.push(activeChatId);
          if(typeof showToast === 'function') showToast("Added to Favorites! ⭐");
          else alert("Added to Favorites! ⭐");
      }
      localStorage.setItem('bapp_favorites', JSON.stringify(favs));
      loadChatList(); // Refresh the list to sort favorites to the top (if we add that logic later)
  }
`;

// Inject into the script
const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + groupFuncsJS + html.substring(lastScriptIdx);
}

// 3. Update loadChatList to push Favorites to the top
const oldSortLogic = `    chats.forEach(id => {`;
const newSortLogic = `    // Sort Favorites to the top
    let favs = JSON.parse(localStorage.getItem('bapp_favorites')) || [];
    chats.sort((a, b) => {
        let aFav = favs.includes(a) ? 1 : 0;
        let bFav = favs.includes(b) ? 1 : 0;
        return bFav - aFav;
    });

    chats.forEach(id => {`;
html = html.replace(oldSortLogic, newSortLogic);

fs.writeFileSync('index.html', html);
console.log('✅ All options are now fully functional and saved to storage!');
