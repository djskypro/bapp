const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Lock the body and viewport
const bodyLock = `
<style>
  /* PREVENT VIEWPORT SHIFT */
  html, body {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    overflow: hidden !important;
  }
</style>
</head>`;
html = html.replace('</head>', bodyLock);

// 2. Replace the JS to actually move the input
const oldJsRegex = /if \(window\.visualViewport\) \{[\s\S]*?\n\}/;
const newJs = `if (window.visualViewport) {
  const handleResize = () => {
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    const chatInput = document.querySelector('.chat-input-area');
    if (chatInput) {
      if (keyboardHeight > 100) {
        chatInput.style.bottom = (keyboardHeight + 15) + 'px';
      } else {
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
      }
    }
  };
  window.visualViewport.addEventListener('resize', handleResize);
  window.visualViewport.addEventListener('scroll', handleResize);
}`;
html = html.replace(oldJsRegex, newJs);

fs.writeFileSync('index.html', html);
console.log("✅ Header Lock & Input Push applied.");
