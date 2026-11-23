const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Clear button (X) inside the search box HTML
const oldSearchBox = `<div class="search-box">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
    </div>`;

const newSearchBox = `<div class="search-box" style="position: relative;">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
      <span id="clear-search" style="display:none; cursor:pointer; font-size:18px; color:var(--text-muted); padding:0 5px;" onclick="clearSearch()">✕</span>
    </div>`;

html = html.replace(oldSearchBox, newSearchBox);

// 2. Update the handleSearchInput function to show/hide the X button
const oldSearchJS = `function handleSearchInput() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    if (query.length === 0) { dropdown.style.display = 'none'; return; }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
    }, 300);
  }`;

const newSearchJS = `function handleSearchInput() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    
    if (query.length === 0) { 
      dropdown.style.display = 'none'; 
      clearBtn.style.display = 'none';
      return; 
    }
    
    clearBtn.style.display = 'block'; // Show the X button
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
    }, 300);
  }

  function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-dropdown').innerHTML = '';
  }`;

html = html.replace(oldSearchJS, newSearchJS);

fs.writeFileSync('index.html', html);
console.log('✅ Search clear button added successfully!');
