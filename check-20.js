
  function promptHideChat() {
    document.getElementById('pin-modal').style.display = 'flex';
    document.getElementById('hide-pin-input').value = '';
    document.getElementById('hide-pin-input').focus();
    window.pendingHideChatId = currentSelectedChatId;
    closeChatListMenu();
  }

  function closePinModal() {
    document.getElementById('pin-modal').style.display = 'none';
  }

  function confirmHideChat() {
    const pin = document.getElementById('hide-pin-input').value.trim();
    if (pin.length < 4) {
      alert("PIN must be at least 4 digits!");
      return;
    }
    
    // Save the hidden chat ID and its PIN
    let hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    console.log("HIDING CHAT:", window.pendingHideChatId, "with PIN:", pin);
    console.log("HIDDEN LIST:", hiddenChats);
    hiddenChats[window.pendingHideChatId] = pin;
    localStorage.setItem('bapp_hidden_chats', JSON.stringify(hiddenChats));
    
    // Also save the chat to the hidden list so we can restore it
    let allChats = JSON.parse(localStorage.getItem('bapp_chats')) || [];
    
    closePinModal();
    loadChatList(); // This will refresh the list, and we will hide it in the loadChatList function
  }
