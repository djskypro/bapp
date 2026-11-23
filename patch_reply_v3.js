const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old strict geometry block we added last time
const oldBlockRegex = /<style>\s*\/\* ===== STRICT REPLY PREVIEW GEOMETRY =====[\s\S]*?<\/style>\s*<\/head>/;
html = html.replace(oldBlockRegex, '</head>');

// 2. Add the new, perfect attachment CSS
const newCSS = `
<style>
  /* ===== SEAMLESS ATTACHED REPLY PREVIEW ===== */
  #reply-preview {
    position: fixed !important;
    /* Width matches the input exactly */
    left: 25px !important;
    right: 25px !important;
    width: auto !important;
    max-width: none !important;
    transform: none !important;
    
    /* Sit exactly on the top edge of the input. 20px (bottom) + 56px (input height) = 76px */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 56px) !important;
    
    /* Curve top, flat bottom */
    border-radius: 20px 20px 0 0 !important;
    
    /* Match the glass look */
    background: rgba(25, 25, 25, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-bottom: none !important;
    border-left: 4px solid var(--primary) !important;
    
    padding: 8px 15px !important;
    margin: 0 !important;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.3) !important;
    z-index: 99999 !important;
  }

  /* Make the input box flat on top ONLY when reply is showing, so they merge */
  #reply-preview[style*="display: block"] ~ .chat-input-area,
  #reply-preview[style*="display: flex"] ~ .chat-input-area {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
    border-top: none !important;
  }

  /* Clean up the text inside the reply box */
  #reply-preview-name {
    font-size: 12px !important;
    color: var(--primary) !important;
    font-weight: bold !important;
  }
  
  #reply-preview-text {
    font-size: 13px !important;
    color: rgba(255, 255, 255, 0.6) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    margin-top: 2px !important;
  }
  
  #reply-preview span[onclick="cancelReply()"] {
    color: rgba(255, 255, 255, 0.5) !important;
    font-size: 18px !important;
    cursor: pointer;
  }
</style>
</head>`;
html = html.replace('</head>', newCSS);

// 3. Update the keyboard JS to move it correctly (56px matches the input height)
const oldHandlerRegex = /if \(replyBox && replyBox\.style\.display !== 'none'\) \{\s*replyBox\.style\.bottom = \(keyboardHeight \+ 85\) \+ 'px';\s*\}/;
const newHandler = `if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = (keyboardHeight + 76) + 'px';
        }`;
html = html.replace(oldHandlerRegex, newHandler);

const oldHandlerCloseRegex = /if \(replyBox && replyBox\.style\.display !== 'none'\) \{\s*replyBox\.style\.bottom = 'calc\(max\(20px, env\(safe-area-inset-bottom\)\) \+ 65px\)';\s*\}/;
const newHandlerClose = `if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = 'calc(max(20px, env(safe-area-inset-bottom)) + 56px)';
        }`;
html = html.replace(oldHandlerCloseRegex, newHandlerClose);

fs.writeFileSync('index.html', html);
console.log("✅ Seamless reply attached!");
