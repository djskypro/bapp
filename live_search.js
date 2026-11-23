const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Return a list of matches)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldSearch = `if (data.type === 'search_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            const exists = users[data.query] === true;
            ws.send(JSON.stringify({ type: 'search_result', query: data.query, exists: exists }));
        }`;

const newSearch = `if (data.type === 'search_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            const query = data.query.toLowerCase();
            // Find all users that include the search text
            const matches = Object.keys(users).filter(u => u.includes(query) && u !== data.from);
            ws.send(JSON.stringify({ type: 'search_result', matches: matches }));
        }`;
serverJs = serverJs.replace(oldSearch, newSearch);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. UPDATE UI (Live Dropdown)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Hide the + button
html = html.replace('<div class="icon-btn green" onclick="startNewChat()">+</div>', '<div class="icon-btn green" style="display:none;"></div>');

// B. Make search container relative and add the dropdown div
html = html.replace(
  '<div class="search-box">\n      <span>🔍</span>\n      <input type="text" id="search-input" placeholder="Search username..." onkeypress="handleSearch(event)">\n    </div>',
  `<div class="search-box" style="position: relative;">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
    </div>
    <div id="search-dropdown" class="glass" style="display:none; position:absolute; top:60px; left:20px; right:20px; z-index:100; border-radius:12px; overflow:hidden;"></div>`
);

// C. Remove the old handleSearch and add the new Live Search Logic
const oldSearchJS = `function handleSearch(event) {
    if (event.key === 'Enter') {
      const query = document.getElementById('search-input').value.trim().toLowerCase();
      if (query && query !== myBappId) {
        socket.send(JSON.stringify({ type: 'search_user', query: query }));
      } else if (query === myBappId) {
        alert("That's you! Type someone else's username.");
      }
    }
  }`;

const newSearchJS = `
  let searchTimeout = null;
  function handleSearchInput() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    
    if (query.length === 0) {
      dropdown.style.display = 'none';
      return;
    }
    
    // Wait 300ms after they stop typing before searching (debounce)
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
    }, 300);
  }
`;
html = html.replace(oldSearchJS, newSearchJS);

// D. Update the socket.onmessage to handle the search results list
const oldSocketSearch = `if (data.type === 'search_result') {
        if (data.exists) {
          document.getElementById('search-input').value = '';
          const avatarUrl = 'https://ui-avatars.com/api/?name=' + data.query.substring(0,2) + '&background=random';
          saveChat(data.query);
          loadChatList();
          openChat(data.query, avatarUrl);
        } else {
          alert("User @" + data.query + " not found.");
        }
      }`;

const newSocketSearch = `if (data.type === 'search_result') {
        const dropdown = document.getElementById('search-dropdown');
        dropdown.innerHTML = '';
        
        if (data.matches.length === 0) {
          dropdown.innerHTML = '<div style="padding:15px; color:var(--text-muted); text-align:center;">No users found</div>';
        } else {
          data.matches.forEach(user => {
            const avatarUrl = 'https://ui-avatars.com/api/?name=' + user.substring(0,2) + '&background=random';
            const item = \`
              <div style="display:flex; align-items:center; padding:12px 15px; border-bottom:1px solid var(--glass-border); cursor:pointer;" onclick="selectSearchUser('\${user}', '\${avatarUrl}')">
                <img src="\${avatarUrl}" style="width:35px; height:35px; border-radius:50%; margin-right:12px;">
                <div style="font-weight:500;">\${user}</div>
              </div>
            \`;
            dropdown.insertAdjacentHTML('beforeend', item);
          });
        }
        dropdown.style.display = 'block';
      }`;
html = html.replace(oldSocketSearch, newSocketSearch);

// E. Add the function to handle clicking a search result
const selectUserLogic = `
  function selectSearchUser(user, avatarUrl) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    saveChat(user);
    loadChatList();
    openChat(user, avatarUrl);
  }
`;
html = html.replace("function openSettings()", selectUserLogic + "\n  function openSettings()");

fs.writeFileSync('index.html', html);
console.log('Live Search Dropdown added!');
