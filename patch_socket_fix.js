const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the silent failure in sendMessage
const oldSend = `    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});`;
      
const newSend = `    if (text !== "" && socket.readyState !== WebSocket.OPEN) {
      alert("⚠️ You are offline or the server is down. Message not sent.");
      return;
    }
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});`;
      
html = html.replace(oldSend, newSend);

// 2. Add Auto-Reconnect and onclose logic right after socket.onopen
const oldOnopen = `  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
  };`;

const newOnopen = `  socket.onopen = () => {
    console.log("✅ Connected to server.");
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
  };

  socket.onclose = () => {
    console.log("🔴 Disconnected from server. Reconnecting in 3s...");
    // Try to reconnect every 3 seconds
    setTimeout(() => {
        window.location.reload(); // The easiest way to force a fresh socket connection
    }, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket Error: ", err);
  };`;

if (html.includes(oldOnopen)) {
    html = html.replace(oldOnopen, newOnopen);
    fs.writeFileSync('index.html', html);
    console.log('✅ Socket reconnect and offline alert added!');
} else {
    console.log('❌ Could not find socket.onopen block. Aborting.');
}
