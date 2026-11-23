const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS to attach the reply preview to the input area
const replyCSS = `
<style>
  /* ===== LOCKED & STYLED REPLY PREVIEW ===== */
  #reply-preview {
    position: fixed !important;
    bottom: 85px !important; /* Adjust this to sit exactly on top of the input */
    left: 25px !important;
    right: 25px !important;
    z-index: 99999 !important;
    background: rgba(20, 20, 20, 0.85) !important; /* Glassy dark background */
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-left: 4px solid var(--primary) !important; /* WhatsApp green accent */
    border-radius: 12px 12px 0 0 !important; /* Top corners rounded, bottom flat to attach to input */
    padding: 10px 15px !important;
    margin: 0 !important;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.3) !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: transform 0.2s ease-out;
  }

  #reply-preview > div:first-child {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  #reply-preview-name {
    font-size: 12px;
    color: var(--primary) !important; /* Green name */
    font-weight: bold;
  }

  #reply-preview-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7) !important; /* Dimmed text */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Style the close button */
  #reply-preview span[onclick="cancelReply()"] {
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px !important;
    padding: 5px;
  }
</style>
</head>`;
html = html.replace('</head>', replyCSS);

// 2. Update the JS so the preview moves when the keyboard opens
// Find the keyboard visualViewport handler we made earlier
const oldHandlerRegex = /chatHeader\.style\.transform = 'translateY\(' \+ vv\.offsetTop \+ 'px\)';[\s\S]*?chatInput\.style\.bottom = 'max\(20px, env\(safe-area-inset-bottom\)\)';/;
const newHandler = `
        chatHeader.style.transform = 'translateY(' + vv.offsetTop + 'px)';
        
        // Move reply box up with the input box
        const replyBox = document.getElementById('reply-preview');
        if (replyBox) {
          replyBox.style.bottom = (keyboardHeight + 85) + 'px'; // 85 is base input height
        }
      } else {
        // Keyboard is closed
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
        chatHeader.style.transform = 'translateY(0px)';
        
        // Reset reply box
        const replyBox = document.getElementById('reply-preview');
        if (replyBox) {
          replyBox.style.bottom = '85px';
        }
`;
html = html.replace(oldHandlerRegex, newHandler);

fs.writeFileSync('index.html', html);
console.log("✅ Reply badge styled and locked!");
