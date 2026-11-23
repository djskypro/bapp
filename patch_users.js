const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Add User Database & Search)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add users database file
const userDbLogic = `
const USERS_FILE = path.join(__dirname, 'users.json');
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));
`;
serverJs = serverJs.replace("const DB_FILE =", userDbLogic + "\nconst DB_FILE =");

// Handle register_user and search_user
const newLogic = `
        if (data.type === 'register_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            users[data.username] = true; // Save to database
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            
            bappUsers.set(data.username, ws);
            console.log(\`🟢 BAPP User Online: \${data.username}\`);
            ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
        }

        if (data.type === 'search_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            const exists = users[data.query] === true;
            ws.send(JSON.stringify({ type: 'search_result', query: data.query, exists: exists }));
        }
`;
serverJs = serverJs.replace("if (data.type === 'typing') {", newLogic + "\n        if (data.type === 'typing') {");

// Change send_message to use usernames
serverJs = serverJs.replace(
    "if (bappUsers.has(cleanTo)) {\n                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));\n                console.log(\"✅ Delivered to online BAPP user\");",
    "if (bappUsers.has(cleanTo)) {\n                bappUsers.get(cleanTo).send(JSON.stringify({ type: 'new_message', from: from, text: text, isImage: isImage }));\n                console.log(\"✅ Delivered to online BAPP user\");"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH UI (Login Screen & Search Logic)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Give the search input an ID
html = html.replace('<input type="text" placeholder="Search...">', '<input type="text" id="search-input" placeholder="Search username..." onkeypress="handleSearch(event)">');

// Replace `user_` logic with username logic
const oldLogin = `let myBappId = sessionStorage.getItem('bappId');
  if (!myBappId) {
    myBappId = "user_" + Math.floor(Math.random() * 1000);
    sessionStorage.setItem('bappId', myBappId);
  }`;
const newLogin = `let myBappId = localStorage.getItem('bapp_username');
  if (!myBappId) {
    myBappId = prompt("Welcome to BAPP! Choose a unique username:");
    while(!myBappId || myBappId.trim() === "") {
        myBappId = prompt("Username cannot be empty. Please choose a username:");
    }
    myBappId = myBappId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    localStorage.setItem('bapp_username', myBappId);
  }`;
html = html.replace(oldLogin, newLogin);

// Update WebSocket connection to use register_user
html = html.replace("socket.send(JSON.stringify({ type: 'register', userId: myBappId }));", "socket.send(JSON.stringify({ type: 'register_user', username: myBappId }));");

// Add search logic and socket response
const searchLogic = `
  function handleSearch(event) {
    if (event.key === 'Enter') {
      const query = document.getElementById('search-input').value.trim().toLowerCase();
      if (query && query !== myBappId) {
        socket.send(JSON.stringify({ type: 'search_user', query: query }));
      } else if (query === myBappId) {
        alert("That's you! Type someone else's username.");
      }
    }
  }
`;
html = html.replace("function openSettings()", searchLogic + "\n  function openSettings()");

// Handle search result in socket.onmessage
const searchResultLogic = `
      if (data.type === 'search_result') {
        if (data.exists) {
          document.getElementById('search-input').value = '';
          const avatarUrl = 'https://ui-avatars.com/api/?name=' + data.query.substring(0,2) + '&background=random';
          saveChat(data.query);
          loadChatList();
          openChat(data.query, avatarUrl);
        } else {
          alert("User @" + data.query + " not found.");
        }
      }
`;
html = html.replace("if (data.type === 'typing') {", searchResultLogic + "\n      if (data.type === 'typing') {");

// Fix chat item avatar rendering to use usernames
html = html.replace("const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';", "const avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';");

fs.writeFileSync('index.html', html);
console.log('Usernames and real search bar added!');
