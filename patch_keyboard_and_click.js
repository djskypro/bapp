const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX THE KEYBOARD COVERING THE INPUT
// ==========================================
const keyboardCSS = `
<style>
  /* Force the app to resize when keyboard opens */
  html, body {
    height: 100%;
    margin: 0;
    overflow: hidden;
  }
  
  #chat-view {
    display: flex;
    flex-direction: column;
    height: 100dvh; /* Dynamic viewport height */
  }

  .messages {
    flex: 1;
    overflow-y: auto;
  }

  .chat-input-area {
    position: relative !important; /* Keep it in the layout so keyboard pushes it */
    bottom: 0 !important;
    margin-bottom: 15px; /* Space from the bottom edge */
  }
</style>
</head>
`;
// Remove old broken fixed positioning and add the responsive one
html = html.replace('</head>', keyboardCSS);

// ==========================================
// 2. FIX THE CLICK TO SCROLL
// ==========================================
// We will attach a global event listener to the chat container. 
// Whenever you click anything inside a '.quoted-msg', it will find the parent message ID.
const clickLogic = `
<script>
  // Global listener for clicking quotes
  document.addEventListener('click', function(e) {
    const quote = e.target.closest('.quoted-msg');
    if (quote) {
      // Find the ID of the message that contains this quote
      const parentMsg = quote.closest('.msg');
      if (parentMsg && parentMsg.id) {
        const msgId = parentMsg.id.replace('msg-', '');
        
        // Find the original message being replied to
        const originalMsg = document.getElementById('msg-' + msgId);
        
        // If it exists on screen, scroll to it
        if (originalMsg) {
          originalMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          originalMsg.classList.add('highlight-flash');
          setTimeout(() => originalMsg.classList.remove('highlight-flash'), 2000);
        } else {
          console.log("Original message not found on screen.");
        }
      }
    }
  });
</script>
</body>
`;
html = html.replace('</body>', clickLogic);

// 3. Ensure the CSS for the green flash is present
if (!html.includes('.highlight-flash')) {
    html = html.replace('</head>', `
<style>
  .highlight-flash { background-color: rgba(37, 211, 102, 0.8) !important; transition: background-color 0.3s; }
</style>
</head>`);
}

fs.writeFileSync('index.html', html);
console.log('✅ Keyboard layout fixed and Click-to-scroll fixed!');
