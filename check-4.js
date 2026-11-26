
  // We attach these to window so they override the broken ones
  window.handleSearchInput = function() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');
    
    if (query.length === 0) { 
      dropdown.style.display = 'none'; 
      if(clearBtn) clearBtn.style.display = 'none';
      if(blurOverlay) blurOverlay.style.display = 'none';
      return; 
    }
    
    if(clearBtn) clearBtn.style.display = 'block'; 
    if(blurOverlay) blurOverlay.style.display = 'block';
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      // Safely check if socket exists
      if(typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
      } else {
        // If socket is missing, show a fake error for debugging
        dropdown.innerHTML = '<div style="padding:15px; color:red; text-align:center;">Server not connected</div>';
        dropdown.style.display = 'block';
      }
    }, 300);
  };

  window.clearSearch = function() {
    document.getElementById('search-input').value = '';
    const clearBtn = document.getElementById('clear-search');
    if(clearBtn) clearBtn.style.display = 'none';
    
    const dropdown = document.getElementById('search-dropdown');
    if(dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }
    
    const blur = document.getElementById('search-blur-overlay');
    if(blur) blur.style.display = 'none';
  };

  // Overwrite selectSearchUser safely
  const originalSelect = window.selectSearchUser;
  window.selectSearchUser = function(userObj) {
    // Hide blur and dropdown
    const dropdown = document.getElementById('search-dropdown');
    if(dropdown) dropdown.style.display = 'none';
    
    const input = document.getElementById('search-input');
    if(input) input.value = ''; 
    // Snap the keyboard back open instantly after sending
    setTimeout(() => {
        const chatIn = document.getElementById('chat-input');
        const chatView = document.getElementById('chat-view');
        if (chatIn && chatView && chatView.classList.contains('active')) {
            chatIn.focus();
        }
    }, 10);
    
    const blur = document.getElementById('search-blur-overlay');
    if(blur) blur.style.display = 'none';

    // Now run the original logic to open the chat
    if(typeof originalSelect === 'function') {
      originalSelect(userObj);
    } else {
      // Fallback if original failed
      let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
      profiles[userObj.username] = userObj.profile;
      localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
      saveChat(userObj.username);
      loadChatList();
      openChat(userObj.username, userObj.profile);
    }
  };
