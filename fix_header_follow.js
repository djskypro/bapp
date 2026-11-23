const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS that overrides everything and prepares the header to be moved via JS
const css = `
<style>
  /* FINAL FIX: HEADER FOLLOWS SCREEN */
  .chat-header {
    position: fixed !important;
    top: 15px !important;
    left: 15px !important;
    right: 15px !important;
    z-index: 999999 !important;
    transform: translateY(0); /* Will be changed by JS */
    transition: transform 0.1s ease-out;
  }
</style>
</head>`;
html = html.replace('</head>', css);

// 2. Replace the visualViewport JS
const oldJsRegex = /if \(window\.visualViewport\) \{[\s\S]*?\n\}/;
const newJs = `if (window.visualViewport) {
  const handleResize = () => {
    const vv = window.visualViewport;
    const keyboardHeight = window.innerHeight - vv.height;
    
    const chatInput = document.querySelector('.chat-input-area');
    const chatHeader = document.querySelector('.chat-header');

    if (chatInput && chatHeader) {
      if (keyboardHeight > 100) {
        // Keyboard is open
        chatInput.style.bottom = (keyboardHeight + 15) + 'px';
        
        // This is the magic part: 
        // vv.offsetTop is how far the browser scrolled the page up.
        // We push the header DOWN by that exact amount so it stays on screen!
        chatHeader.style.transform = 'translateY(' + vv.offsetTop + 'px)';
      } else {
        // Keyboard is closed
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
        chatHeader.style.transform = 'translateY(0px)';
      }
    }
  };
  window.visualViewport.addEventListener('resize', handleResize);
  window.visualViewport.addEventListener('scroll', handleResize);
}`;
html = html.replace(oldJsRegex, newJs);

fs.writeFileSync('index.html', html);
console.log("✅ Header follow logic applied!");
