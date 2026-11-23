const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the new attached reply CSS right before </head>
const replyCSS = `
<style>
  /* ===== ATTACHED REPLY PREVIEW ===== */
  #reply-preview {
    position: fixed !important;
    /* Attach it directly above the input box */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 65px) !important; 
    left: 25px !important;
    right: 25px !important;
    width: auto !important; /* Let left/right control the width */
    max-width: none !important;
    transform: none !important; /* Remove the old translateX */
    
    /* Style it to look like it belongs there */
    background: rgba(20, 20, 20, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-left: 4px solid var(--primary) !important;
    border-radius: 12px 12px 0 0 !important;
    padding: 10px 15px !important;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.5) !important;
    z-index: 99999 !important;
  }

  #reply-preview-name {
    font-size: 12px !important;
    color: var(--primary) !important;
    font-weight: bold !important;
  }

  #reply-preview-text {
    font-size: 14px !important;
    color: rgba(255, 255, 255, 0.7) !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
</style>
</head>`;
html = html.replace('</head>', replyCSS);

// 2. Update the keyboard JS to move the reply box with the input box
const oldHandlerRegex = /chatHeader\.style\.transform = 'translateY\(' \+ vv\.offsetTop \+ 'px\)';[\s\S]*?chatInput\.style\.bottom = 'max\(20px, env\(safe-area-inset-bottom\)\)';/;
const newHandler = `
        chatHeader.style.transform = 'translateY(' + vv.offsetTop + 'px)';
        
        // Move the reply box up with the input
        const replyBox = document.getElementById('reply-preview');
        if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = (keyboardHeight + 85) + 'px';
        }
      } else {
        // Keyboard is closed
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
        chatHeader.style.transform = 'translateY(0px)';
        
        // Put the reply box back down
        const replyBox = document.getElementById('reply-preview');
        if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = 'calc(max(20px, env(safe-area-inset-bottom)) + 65px)';
        }
`;
html = html.replace(oldHandlerRegex, newHandler);

fs.writeFileSync('index.html', html);
console.log("✅ Reply preview fixed and attached!");
