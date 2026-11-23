const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const smoothCSS = `
<style>
  /* ===== HARDWARE ACCELERATION & SMOOTHNESS ===== */
  
  /* 1. Prep the chat view for smooth GPU animations */
  .view, #chat-view, .messages, .chat-header {
    will-change: transform, opacity;
    transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }

  /* 2. Optimize the chat header blur */
  .chat-header {
    backdrop-filter: blur(10px) !important; /* Reduced from 20px to stop lag */
    -webkit-backdrop-filter: blur(10px) !important;
  }

  /* 3. Optimize the message bubbles during animation */
  .msg {
    transform: translateZ(0); /* Forces GPU rendering for the Matrix text */
  }

  /* 4. Smooth out the scroll container */
  .messages {
    -webkit-overflow-scrolling: touch; /* Native iOS/Android momentum scrolling */
    scroll-behavior: smooth;
  }
</style>
</head>`;
html = html.replace('</head>', smoothCSS);
fs.writeFileSync('index.html', html);
console.log("✅ Smoothness and GPU acceleration added!");
