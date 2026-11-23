const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject Bulletproof CSS right before </head>
const cssInject = `
<style>
  /* BLUR OVERLAY */
  #search-blur-overlay {
    position: fixed !important;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    z-index: 900 !important;
    display: none;
  }

  /* FORCE SEARCH CONTAINER AND DROPDOWN TO THE VERY TOP */
  .search-container {
    position: relative !important;
    z-index: 1000 !important;
  }
  #search-dropdown {
    position: absolute !important;
    top: 100% !important; left: 0; right: 0;
    z-index: 1001 !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(30px) !important;
    -webkit-backdrop-filter: blur(30px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 12px !important;
    margin-top: 5px !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important;
    overflow: hidden;
  }
</style>
</head>
`;
html = html.replace('</head>', cssInject);

// 2. Ensure the HTML elements exist
if(!html.includes('id="search-blur-overlay"')){
    html = html.replace('<div id="main-view" class="view active">', '<div id="main-view" class="view active">\n  <div id="search-blur-overlay"></div>');
}

// 3. Overwrite the Search Functions safely using window object (so they attach to the global scope)
const jsInject = `
<script>
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
</script>
</body>
`;
html = html.replace('</body>', jsInject);

fs.writeFileSync('index.html', html);
console.log('✅ Bulletproof search and blur injected!');
