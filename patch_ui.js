const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add WebSocket logic before the closing </script> tag
const wsLogic = `
  // --- WEBSOCKET CONNECTION ---
  const socket = new WebSocket('ws://' + location.host);
  const myBappId = "user_" + Math.floor(Math.random() * 1000); // Random ID for testing
  
  socket.onopen = () => {
    console.log("Connected to BAPP Server as " + myBappId);
    socket.send(JSON.stringify({ type: 'register', userId: myBappId }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Handle incoming BAPP message
    if (data.type === 'new_message' || data.type === 'new_whatsapp_message') {
      // If we are currently looking at this chat, append it
      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName.includes(data.from)) {
        appendMessage(data.text, 'received');
      } else {
        alert("New message from " + data.from + ": " + data.text);
      }
    }
    
    // Handle offline messages loading
    if (data.type === 'offline_messages') {
      alert("You have " + data.messages.length + " offline messages!");
    }
  };

  function appendMessage(text, type) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    newMsg.innerText = text;
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // Override the sendMessage function to route through the server
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      // Send to server
      socket.send(JSON.stringify({
        type: 'send_message',
        to: to, // We are using the name as the ID for this test
        from: myBappId,
        text: text
      }));
      
      // Update UI locally
      appendMessage(text, 'sent');
      input.value = '';
    }
  };
`;

html = html.replace('</script>\n</body>', wsLogic + '\n</script>\n</body>');
fs.writeFileSync('index.html', html);
console.log('UI patched to connect to Hybrid Server!');
