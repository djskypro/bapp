const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add BAPP ID display to header
html = html.replace('<h1>Chats</h1>', '<div><h1>Chats</h1><div id="my-id" style="font-size:12px; color:var(--text-muted); margin-top:-5px;">ID: connecting...</div></div>');

// 2. Replace the "Over night" chat with a test BAPP user
html = html.replace('Over night 😴', 'Test BAPP User');
html = html.replace(/onclick="openChat\('Over night 😴'[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, `
    <div class="chat-item" onclick="openChat('user_2', 'https://ui-avatars.com/api/?name=User+2&background=random')">
      <img src="https://ui-avatars.com/api/?name=User+2&background=random" class="avatar">
      <div class="chat-info">
        <div class="chat-top"><div class="chat-name">user_2</div><div class="chat-time">Now</div></div>
        <div class="chat-bottom"><div class="chat-msg">Tap to chat with user_2</div></div>
      </div>
    </div>

    <div class="chat-item" onclick="openChat('My WhatsApp', 'https://ui-avatars.com/api/?name=WA&background=25D366')">
      <img src="https://ui-avatars.com/api/?name=WA&background=25D366" class="avatar">
      <div class="chat-info">
        <div class="chat-top"><div class="chat-name">My WhatsApp (Note to Self)</div><div class="chat-time">Now</div></div>
        <div class="chat-bottom"><div class="chat-msg">Test your WhatsApp connection</div></div>
      </div>
    </div>
`);

// 3. Update JS logic
const newJS = `
  const socket = new WebSocket('ws://' + location.host);
  let myBappId = "user_" + Math.floor(Math.random() * 1000); 
  if (!sessionStorage.getItem('bappId')) sessionStorage.setItem('bappId', myBappId);
  myBappId = sessionStorage.getItem('bappId'); // Keep ID stable per tab
  
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register', userId: myBappId }));
    document.getElementById('my-id').innerText = "Your ID: " + myBappId;
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'my_number') {
      console.log("Linked to WhatsApp: " + data.number);
    }

    if (data.type === 'status') {
      document.getElementById('chat-status').innerText = data.text;
      setTimeout(() => document.getElementById('chat-status').innerText = '', 3000);
    }

    if (data.type === 'new_message') {
      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      } else {
        alert("New BAPP message from " + data.from + ": " + data.text);
      }
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

  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      appendMessage(text, 'sent');
      input.value = '';
    }
  };
`;
html = html.replace(/const socket = new WebSocket[\s\S]*?};/, newJS);
fs.writeFileSync('index.html', html);
console.log('UI Patched!');
