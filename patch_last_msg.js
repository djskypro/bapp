const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force a massive padding at the bottom of the messages
const fixCSS = `
<style>
  .messages {
    padding-bottom: 140px !important; /* Increased to clear the input + nav bar */
  }
  .chat-input-area {
    /* Make sure the input doesn't overlap the very bottom of the screen */
    bottom: max(20px, env(safe-area-inset-bottom)) !important;
  }
</style>
</head>
`;
html = html.replace('</head>', fixCSS);

// 2. Also add an invisible div at the bottom of the messages box in HTML
html = html.replace('<div class="messages" id="chat-messages"></div>', 
  '<div class="messages" id="chat-messages"><div id="chat-spacer" style="height: 10px; width: 100%;"></div></div>');

// 3. Update the JS append logic to keep the spacer at the very bottom
const oldAppend = `msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;`;
const newAppend = `msgBox.insertBefore(newMsg, document.getElementById('chat-spacer'));
    msgBox.scrollTop = msgBox.scrollHeight;`;
html = html.replace(oldAppend, newAppend);

// 4. Fix the initial load logic to keep the spacer
const oldLoad = `msgBox.innerHTML = ""; 
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];`;
const newLoad = `msgBox.innerHTML = '<div id="chat-spacer" style="height: 10px; width: 100%;"></div>'; 
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];`;
html = html.replace(oldLoad, newLoad);

fs.writeFileSync('index.html', html);
console.log('✅ Ghost spacer and padding added to fix hidden messages!');
