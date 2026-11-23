const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rewrite the Search Input Logic
const oldSearchJS = `function handleSearchInput() {
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
  }`;

const newSearchJS = `function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const chatList = document.getElementById('chat-list-container');
    
    if (query.length === 0) { 
      dropdown.style.display = 'none'; 
      clearBtn.style.display = 'none';
      chatList.style.display = 'flex'; // Show chats again
      return; 
    }
    
    clearBtn.style.display = 'block'; 
    chatList.style.display = 'none'; // Hide chats while searching
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if(socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
      }
    }, 300);
  }`;

if(html.includes(oldSearchJS)) {
    html = html.replace(oldSearchJS, newSearchJS);
}

// 2. Update clearSearch to bring the list back
const oldClearJS = `function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    const dropdown = document.getElementById('search-dropdown');
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }`;

const newClearJS = `function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('clear-search').style.display = 'none';
    const dropdown = document.getElementById('search-dropdown');
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    document.getElementById('chat-list-container').style.display = 'flex'; // Show chats
  }`;

if(html.includes(oldClearJS)) {
    html = html.replace(oldClearJS, newClearJS);
}

// 3. Update selectSearchUser to bring the list back
const oldSelectJS = `function selectSearchUser(userObj) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};`;

const newSelectJS = `function selectSearchUser(userObj) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('chat-list-container').style.display = 'flex'; // Show chats
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};`;

if(html.includes(oldSelectJS)) {
    html = html.replace(oldSelectJS, newSelectJS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Chat list now hides cleanly when searching!');
