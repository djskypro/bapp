const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add the keyboard CSS override at the end of head
const keyboardCSS = `
<style>
  /* KEYBOARD FIX: Don't resize the whole app */
  html, body {
    height: 100dvh;
    overflow: hidden;
  }

  #main-view {
    height: 100dvh;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
  }

  #chat-view {
    height: 100dvh;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
  }

  /* Lock the input to the bottom and let it slide up with the keyboard */
  .chat-input-area {
    position: fixed !important;
    bottom: 0 !important;
    left: 25px !important;
    right: 25px !important;
    margin-bottom: max(20px, env(safe-area-inset-bottom)) !important;
    z-index: 2000 !important;
  }

  /* Push messages up so they don't hide behind the fixed input */
  .messages {
    padding-bottom: 140px !important;
  }
</style>
</head>`;

if (!html.includes('KEYBOARD FIX')) {
    html = html.replace('</head>', keyboardCSS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Keyboard fix applied! App won\'t resize, only input slides.');
