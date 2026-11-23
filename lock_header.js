const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove any previous keyboard fix CSS blocks to start fresh
html = html.replace(/\/\* TRUE KEYBOARD FIX \*\/[\s\S]*?<\/style>/, '');

// 2. Add the absolute lock CSS right before </head>
const css = `
<style>
  /* WHATSAPP ABSOLUTE HEADER LOCK */
  html, body {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    height: 100vh !important;
    width: 100vw !important;
    overflow: hidden !important;
  }
  .chat-header {
    position: fixed !important;
    top: 15px !important;
    left: 15px !important;
    right: 15px !important;
    z-index: 999999 !important;
  }
  .chat-input-area {
    position: fixed !important;
    z-index: 999999 !important;
    transition: bottom 0.1s ease-out !important;
  }
</style>
</head>`;
html = html.replace('</head>', css);

// 3. Rewrite the visualViewport JS to ONLY move the input
const oldJsRegex = /if \(window\.visualViewport\) \{[\s\S]*?window\.visualViewport\.addEventListener\('scroll', handleResize\);\s*\}/;
const newJs = `if (window.visualViewport) {
  const handleResize = () => {
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    const chatInput = document.querySelector('.chat-input-area');
    if (chatInput) {
      if (keyboardHeight > 100) {
        // Keyboard is open: slide input up
        chatInput.style.bottom = (keyboardHeight + 15) + 'px';
      } else {
        // Keyboard is closed: put it back to normal
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
      }
    }
  };
  window.visualViewport.addEventListener('resize', handleResize);
  window.visualViewport.addEventListener('scroll', handleResize);
}`;
html = html.replace(oldJsRegex, newJs);

fs.writeFileSync('index.html', html);
console.log("✅ WhatsApp Header Lock Applied!");
