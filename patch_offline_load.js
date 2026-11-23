const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact block from your output (Lines 1482-1486)
const oldSocketLogic = `  socket.onopen = () => {
    loadChatList();
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    loadChatList();
  };`;

// The new logic: Load chats immediately, then connect to socket
const newSocketLogic = `  // 1. Load the UI and chats instantly (works offline)
  loadChatList();
  document.getElementById('my-id').innerText = "Your ID: @" + myBappId;

  // 2. Connect to server when online
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
  };`;

if (html.includes(oldSocketLogic)) {
    html = html.replace(oldSocketLogic, newSocketLogic);
    fs.writeFileSync('index.html', html);
    console.log('✅ Offline chat loading fixed!');
} else {
    console.log('❌ Could not find the exact socket block. Aborting.');
}
