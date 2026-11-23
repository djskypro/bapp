const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. CSS OPTIMIZATIONS
const smoothCSS = `
<style>
  /* 1. Reduce heavy blurs for GPU performance */
  .glass, .bottom-nav, .chat-header, .chat-input-area, .search-box, #search-dropdown {
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
  }

  /* 2. Force GPU Hardware Acceleration on animations */
  .msg, #magic-ball, .view {
    will-change: transform, opacity !important;
    transform: translateZ(0) !important;
    backface-visibility: hidden !important;
  }

  /* 3. Fix glitching when scrolling */
  * {
    -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
  }
  
  /* 4. Stop image layout shifts */
  .msg img {
    background: rgba(255,255,255,0.05);
    min-height: 50px;
  }
</style>
</head>
`;
html = html.replace('</head>', smoothCSS);

// 2. JAVASCRIPT OPTIMIZATIONS
// Stop the chat list from rebuilding entirely on every single keystroke or tiny update.
const oldLoadChatList = `function loadChatList() {`;
const newLoadChatList = `function loadChatList() {
    // Prevent redundant renders if we're not on the main view
    if (!document.getElementById('main-view').classList.contains('active') && !document.getElementById('status-view').classList.contains('active')) return;`;

html = html.replace(oldLoadChatList, newLoadChatList);

// 3. Throttle the typing indicator so it doesn't spam the server
const oldTyping = `document.getElementById('chat-input').addEventListener('input', function() {
    const to = activeChatId;
    if (!to || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: true }));
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
    }, 2000);
  });`;

const newTyping = `let lastTypingSent = 0;
  document.getElementById('chat-input').addEventListener('input', function() {
    const to = activeChatId;
    if (!to || socket.readyState !== WebSocket.OPEN) return;
    
    const now = Date.now();
    // Only send a typing signal every 2 seconds to save processing power
    if (now - lastTypingSent > 2000) {
        socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: true }));
        lastTypingSent = now;
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
      lastTypingSent = 0;
    }, 2000);
  });`;
html = html.replace(oldTyping, newTyping);

fs.writeFileSync('index.html', html);
console.log('✅ App smoothed out! Blurs reduced, GPU acceleration added, and rendering optimized.');
