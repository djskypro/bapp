const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* LOCK HEADER AT TOP WHEN KEYBOARD OPENS */
  html, body {
    height: 100dvh !important;
    overflow: hidden !important;
    position: fixed !important;
    width: 100vw !important;
    top: 0 !important;
    left: 0 !important;
  }

  #chat-view {
    height: 100dvh !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Force header to stay at the top */
  .chat-header {
    position: fixed !important;
    top: 15px !important;
    left: 15px !important;
    right: 15px !important;
    z-index: 9999999 !important;
  }

  /* Messages container scrolls behind header and input */
  .messages {
    position: absolute !important;
    top: 80px !important;
    bottom: 80px !important;
    left: 0 !important;
    right: 0 !important;
    overflow-y: auto !important;
    padding: 20px !important;
  }

  /* Input stays at bottom */
  .chat-input-area {
    position: fixed !important;
    bottom: max(20px, env(safe-area-inset-bottom)) !important;
    left: 25px !important;
    right: 25px !important;
    z-index: 9999999 !important;
  }
</style>
</head>`;

if (!html.includes('LOCK HEADER AT TOP')) {
    html = html.replace('</head>', fixCSS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Header locked at top! Keyboard won\'t push it away.');
