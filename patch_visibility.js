const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const visibilityCode = `
  // Listen for when the user comes back to the tab (fixes Android backgrounding)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log("👀 Tab focused again. Checking for missed messages...");
      // If the socket is closed or closing, force a reconnect
      if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (typeof reconnectWebSocket === 'function') reconnectWebSocket();
      } else if (socket.readyState === WebSocket.OPEN) {
        // If it's still open, ping the server to get any offline messages
        socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
      }
    }
  });

  // Listen for the phone's internet coming back
  window.addEventListener('online', () => {`;

// Insert before the 'online' listener
html = html.replace("// Listen for the phone's internet coming back\n  window.addEventListener('online', () => {", visibilityCode);

fs.writeFileSync('index.html', html);
console.log("✅ Visibility listener added!");
