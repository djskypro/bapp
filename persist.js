const fs = require('fs');

// --- 1. UPDATE SERVER.JS ---
let serverJs = fs.readFileSync('server.js', 'utf8');
// Update the log so it clearly shows WHO sent the message
serverJs = serverJs.replace(
    "console.log(`📤 Sending to BAPP User: ${to}`);",
    "console.log(`📩 Msg from [${from}] to [${to}]: ${text}`);"
);
fs.writeFileSync('server.js', serverJs);

// --- 2. UPDATE INDEX.HTML ---
let html = fs.readFileSync('index.html', 'utf8');

// A. Update openChat to load messages from localStorage
const oldOpenChat = `function openChat(name, avatarSrc) {
    hideAllViews();
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').innerText = name;
    document.getElementById('chat-avatar').src = avatarSrc;
    
    // Clear chat and add a greeting
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = "";
    
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }`;

const newOpenChat = `function openChat(name, avatarSrc) {
    hideAllViews();
    document.getElementById('chat-view').classList.add('active');
    document.getElementById('chat-name').innerText = name;
    document.getElementById('chat-avatar').src = avatarSrc;
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = "";
    
    // LOAD MESSAGES FROM LOCAL STORAGE
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_chat_' + name)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, false));
    
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
  }`;

html = html.replace(oldOpenChat, newOpenChat);

// B. Update sendMessage to SAVE to localStorage
const oldSendMessage = `window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      appendMessage(text, 'sent');
      input.value = '';
    }
  };`;

const newSendMessage = `window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = document.getElementById('chat-name').innerText;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: text }));
      appendMessage(text, 'sent');
      
      // SAVE TO LOCAL STORAGE
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_chat_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent' });
      localStorage.setItem('bapp_chat_' + to, JSON.stringify(savedMsgs));
      
      input.value = '';
    }
  };`;

html = html.replace(oldSendMessage, newSendMessage);

// C. Update socket.onmessage to SAVE incoming messages to localStorage
const oldReceive = `if (data.type === 'new_message') {
      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      } else {
        alert("New BAPP message from " + data.from + ": " + data.text);
      }
    }`;

const newReceive = `if (data.type === 'new_message') {
      // SAVE INCOMING TO LOCAL STORAGE
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_chat_' + data.from)) || [];
      savedMsgs.push({ text: data.text, type: 'received' });
      localStorage.setItem('bapp_chat_' + data.from, JSON.stringify(savedMsgs));

      const currentChatName = document.getElementById('chat-name').innerText;
      if (currentChatName === data.from) {
        appendMessage(data.text, 'received');
      } else {
        alert("New BAPP message from " + data.from + ": " + data.text);
      }
    }`;

html = html.replace(oldReceive, newReceive);

// D. Update appendMessage to optionally not save (to prevent duplicates when loading)
const oldAppend = `function appendMessage(text, type) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    newMsg.innerText = text;
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }`;

const newAppend = `function appendMessage(text, type, save = true) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    newMsg.innerText = text;
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }`;

html = html.replace(oldAppend, newAppend);

fs.writeFileSync('index.html', html);
console.log('Server logging and LocalStorage persistence added!');
