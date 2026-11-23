const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Blur Overlay CSS
const newCSS = `
<style>
  /* The Blur Layer */
  #search-blur-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5); /* Darken */
    backdrop-filter: blur(12px); /* Blur effect */
    -webkit-backdrop-filter: blur(12px);
    z-index: 900;
    display: none;
    pointer-events: none; /* Let clicks pass through */
  }

  /* Ensure search bar and results are above the blur */
  .search-container {
    position: relative !important;
    z-index: 1000 !important;
  }
  #search-dropdown {
    z-index: 1001 !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. Add the Blur Overlay HTML right after the main view opens
html = html.replace('<div id="main-view" class="view active">', '<div id="main-view" class="view active">\n  <div id="search-blur-overlay"></div>');

// 3. Update the Search Logic to trigger the blur
const oldSearchJS = `function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const chatList = document.getElementById('chat-list-container');
    
    if (query.length === 0) { 
      dropdown.style.display = 'none'; 
      clearBtn.style.display = 'none';
      chatList.style.display = 'flex';
      return; 
    }
    
    clearBtn.style.display = 'block'; 
    chatList.style.display = 'none';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if(socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
      }
    }, 300);
  }`;

const newSearchJS = `function handleSearchInput() {
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
    blurOverlay.style.display = 'block'; // Turn on the blur
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if(socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
      }
    }, 300);
  }`;

if(html.includes(oldSearchJS)) {
    html = html.replace(oldSearchJS, newSearchJS);
} else {
    // Fallback if the previous patch didn't apply exactly
    html = html.replace(/function handleSearchInput\(\) \{[\s\S]*?}, 300\);\n  \}/, newSearchJS);
}

// 4. Update clearSearch to remove the blur
const oldClearJS = /function clearSearch\(\) \{[\s\S]*?\}/;
const newClearJS = `function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-dropdown').innerHTML = '';
    document.getElementById('search-blur-overlay').style.display = 'none'; // Turn off blur
  }`;
html = html.replace(oldClearJS, newClearJS);

// 5. Update selectSearchUser to remove the blur when a user is clicked
const oldSelectJS = /function selectSearchUser\(userObj\) \{[\s\S]*?let profiles/;
const newSelectJS = `function selectSearchUser(userObj) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('search-blur-overlay').style.display = 'none'; // Turn off blur
    let profiles`;
html = html.replace(oldSelectJS, newSelectJS);

fs.writeFileSync('index.html', html);
console.log('✅ Search blur overlay activated!');
