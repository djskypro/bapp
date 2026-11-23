const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Lock the layout so the browser can't resize it
const lockCSS = `
<style>
  /* STOP THE BROWSER FROM RESIZING THE APP */
  html, body {
    height: 100dvh !important;
    overflow: hidden !important;
    position: fixed !important;
    width: 100vw !important;
  }
  
  #chat-view {
    height: 100dvh !important;
    position: fixed !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  }

  /* KEEP THE HEADER PINNED AT THE TOP */
  .chat-header {
    position: fixed !important;
    top: 15px !important; left: 15px !important; right: 15px !important;
    z-index: 9999999 !important;
  }
</style>
</head>`;
if (!html.includes('STOP THE BROWSER')) {
    html = html.replace('</head>', lockCSS);
}

// 2. Use VisualViewport API to push ONLY the typing box up
const vvJS = `
  // --- KEYBOARD VISUAL VIEWPORT FIX ---
  if (window.visualViewport) {
      const handleResize = () => {
          const keyboardHeight = window.innerHeight - window.visualViewport.height;
          const chatInput = document.querySelector('.chat-input-area');
          if (chatInput) {
              // Push the input area up by the keyboard height
              chatInput.style.bottom = Math.max(20, keyboardHeight + 20) + 'px';
          }
      };
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + vvJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Keyboard fix: Header stays locked, only input slides up.');
}
