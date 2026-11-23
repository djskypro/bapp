const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Use textContent and trim for the Chat Name
html = html.replace(/document.getElementById\('chat-name'\).innerText/g, "document.getElementById('chat-name').textContent");
html = html.replace(/const to = document.getElementById\('chat-name'\).textContent;/g, "const to = document.getElementById('chat-name').textContent.trim();");
html = html.replace(/document.getElementById\('chat-name'\).textContent = id;/g, "document.getElementById('chat-name').textContent = id.trim();");

// 2. Bulletproof appendMessage
const oldAppend = `function appendMessage(text, type, timeStr, save = true) {
    const msgBox = document.getElementById('chat-messages');
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.innerText = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    newMsg.innerText = text;
    newMsg.appendChild(timeSpan);
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }`;

const newAppend = `function appendMessage(text, type, timeStr) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;

    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const textNode = document.createTextNode(text);
    newMsg.appendChild(textNode);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }`;
html = html.replace(oldAppend, newAppend);

// 3. Fix the matching logic in socket.onmessage
const oldSocket = `const currentChatName = document.getElementById('chat-name').textContent;
      if (currentChatName === data.from) {`;

const newSocket = `const currentChatName = document.getElementById('chat-name').textContent.trim();
      const senderId = (data.from || '').trim();
      
      if (currentChatName === senderId) {`;
html = html.replace(oldSocket, newSocket);

fs.writeFileSync('index.html', html);
console.log('Real-time chat reception fixed!');
