const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX THE LAYERING (Z-INDEX) SO RESULTS ALWAYS SHOW ON TOP
const fixCSS = `
<style>
  /* Force search container to the absolute top layer */
  .search-container {
    position: relative !important;
    z-index: 9999 !important;
  }
  /* Make the dropdown appear directly below the search bar and stay on top */
  #search-dropdown {
    position: absolute !important;
    top: 100% !important; 
    left: 20px !important;
    right: 20px !important;
    z-index: 10000 !important;
    margin-top: 5px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8) !important;
  }
</style>
</head>
`;
html = html.replace('</head>', fixCSS);

// 2. FIX THE BROKEN JAVASCRIPT (Clean rewrite of the search functions)
const startSearch = html.indexOf('function handleSearchInput() {');
const endSearch = html.indexOf('function selectSearchUser(');

if(startSearch !== -1 && endSearch !== -1) {
  const newSearchLogic = `
  let searchTimeout = null;
  function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    
    if (query.length === 0) { 
      dropdown.style.display = 'none'; 
      clearBtn.style.display = 'none';
      return; 
    }
    
    clearBtn.style.display = 'block'; 
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if(socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
      }
    }, 300);
  }

  function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    const dropdown = document.getElementById('search-dropdown');
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }

  `;
  html = html.substring(0, startSearch) + newSearchLogic + html.substring(endSearch);
}

fs.writeFileSync('index.html', html);
console.log('✅ Search fixed and forced to the top layer!');
