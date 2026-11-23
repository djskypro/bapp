const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Change const socket to let socket and add reconnect timer
html = html.replace(
    "const socket = new WebSocket('ws://' + location.host);",
    "let socket = new WebSocket('ws://' + location.host);\n  let reconnectTimer = null;"
);

// 2. Replace the broken onclose logic with the silent reconnect function
const oldOnclose = `  socket.onclose = () => {
    console.log("🔴 Disconnected from server. Reconnecting in 3s...");
    // Try to reconnect every 3 seconds
    setTimeout(() => {
        window.location.reload(); // The easiest way to force a fresh socket connection
    }, 3000);
  };`;

const newOnclose = `  socket.onclose = () => {
    console.log("🔴 Disconnected from server. Trying to reconnect...");
    if (!reconnectTimer) {
        reconnectTimer = setTimeout(reconnectWebSocket, 3000);
    }
  };

  function reconnectWebSocket() {
    reconnectTimer = null;
    console.log("🔄 Attempting silent reconnect...");
    
    // Save the current message handler so we don't lose it
    const currentHandler = socket.onmessage;
    
    // Create a fresh socket
    socket = new WebSocket('ws://' + location.host);
    
    socket.onopen = () => {
        console.log("✅ Reconnected successfully!");
        socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    };
    
    socket.onclose = () => {
        console.log("🔴 Disconnected again. Retrying...");
        if (!reconnectTimer) reconnectTimer = setTimeout(reconnectWebSocket, 3000);
    };
    
    socket.onerror = (err) => console.error("WebSocket Error: ", err);
    
    // Reattach all the message listeners we built earlier
    if (currentHandler) {
        socket.onmessage = currentHandler;
    }
  }

  // Listen for the phone's internet coming back
  window.addEventListener('online', () => {
    console.log("🌐 Network restored. Reconnecting instantly...");
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectWebSocket();
    }
  });`;

html = html.replace(oldOnclose, newOnclose);

// 3. Fix sendMessage so it alerts you if you try to send while disconnected
const oldSendCheck = `    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});`;
      
const newSendCheck = `    if (text !== "" && socket.readyState !== WebSocket.OPEN) {
      alert("⚠️ You are offline. Message not sent. Please wait for reconnection.");
      return;
    }

    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});`;
      
html = html.replace(oldSendCheck, newSendCheck);

fs.writeFileSync('index.html', html);
console.log('✅ Silent reconnect logic added!');
