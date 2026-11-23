const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Match the whole handleSearchInput function
const oldFuncRegex = /function handleSearchInput\(\) \{[\s\S]*?searchTimeout = setTimeout\(\(\) => \{[\s\S]*?\}, 300\);\s*\}/;

const newFunc = `function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');

    if (query.length === 0) {
      dropdown.style.display = 'none';
      clearBtn.style.display = 'none';
      blurOverlay.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';
    blurOverlay.style.display = 'block';

    // 1. Check for the Secret PIN
    const globalPin = localStorage.getItem('bapp_global_pin');
    if (globalPin && query === globalPin) {
      dropdown.style.display = "block";
      dropdown.innerHTML = "<div onclick=\\"openHiddenChatsFromSearch()\\" style=\\"padding:15px; text-align:center; color:var(--primary); font-weight:bold; cursor:pointer; background:rgba(37,211,102,0.1); border-radius:10px; margin:5px;\\">🔓 Open Hidden Chats</div>";
      return;
    }

    // 2. Search Local Messages
    let resultHTML = '';
    const chats = getChats();
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    chats.forEach(id => {
      if (hiddenChats[id]) return; // Skip hidden chats in normal search
      
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      const name = profiles[id] ? (profiles[id].name || id) : id;
      
      // Check if contact name matches
      const contactMatch = name.toLowerCase().includes(query);

      // Check if any message matches
      const matchingMsgs = msgs.filter(m => m.text && !m.text.startsWith('data:') && m.text.toLowerCase().includes(query));

      if (contactMatch || matchingMsgs.length > 0) {
        let msgsToShow = matchingMsgs.length > 0 ? matchingMsgs : msgs.slice(-1);
        
        msgsToShow.forEach(m => {
          resultHTML += \`
            <div onclick="document.getElementById('search-dropdown').style.display='none'; document.getElementById('search-input').value=''; openChat('\\\${id}')" style="padding:12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:4px;">
              <div style="font-weight:bold; color:var(--primary); font-size:14px;">\\\${name}</div>
              <div style="color:#ccc; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\\\${m.text || 'Media message'}</div>
            </div>
          \`;
        });
      }
    });

    if (resultHTML !== '') {
      dropdown.innerHTML = resultHTML;
      dropdown.style.display = 'block';
    } else {
      // 3. Fallback to server search (users)
      dropdown.innerHTML = '<div style="padding:15px; text-align:center; color:#aaa;">No results found</div>';
      dropdown.style.display = 'block';
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if(socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
        }
      }, 300);
    }
  }`;

html = html.replace(oldFuncRegex, newFunc);
fs.writeFileSync('index.html', html);
console.log("✅ WhatsApp-style search added!");
