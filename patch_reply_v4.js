const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old reply CSS blocks
html = html.replace(/<style>\s*\/\* ===== SEAMLESS ATTACHED REPLY PREVIEW =====[\s\S]*?<\/style>\s*<\/head>/, '</head>');
html = html.replace(/<style>\s*\/\* ===== STRICT REPLY PREVIEW GEOMETRY =====[\s\S]*?<\/style>\s*<\/head>/, '</head>');

// 2. Add the new "Floating Neon Glass" Reply CSS
const newCSS = `
<style>
  /* ===== FLOATING NEON GLASS REPLY PREVIEW ===== */
  #reply-preview {
    position: fixed !important;
    /* Sit exactly in the gap above the input box */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 80px) !important;
    
    /* Make it slightly narrower than the input box so it looks like a floating bubble */
    left: 35px !important;
    right: 35px !important;
    width: auto !important;
    max-width: none !important;
    transform: none !important;
    
    /* Smooth fully rounded pill */
    border-radius: 20px !important;
    
    /* Liquid Glass look with Neon Green glow */
    background: rgba(20, 20, 20, 0.85) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(37, 211, 102, 0.4) !important; /* Faint green border */
    border-left: 4px solid var(--primary) !important; /* Bold green accent */
    
    padding: 10px 15px !important;
    margin: 0 !important;
    
    /* Neon Glow Shadow */
    box-shadow: 
      0 0 15px rgba(37, 211, 102, 0.2),
      0 8px 20px rgba(0,0,0,0.6) !important;
    
    z-index: 99999 !important;
  }

  /* Clean up the text inside the reply box */
  #reply-preview-name {
    font-size: 12px !important;
    color: var(--primary) !important;
    font-weight: bold !important;
  }
  
  #reply-preview-text {
    font-size: 13px !important;
    color: rgba(255, 255, 255, 0.7) !important;
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

// 3. Update the keyboard JS so it moves smoothly with the new offset (80px)
const oldHandlerRegex = /if \(replyBox && replyBox\.style\.display !== 'none'\) \{\s*replyBox\.style\.bottom = \(keyboardHeight \+ 76\) \+ 'px';\s*\}/;
const newHandler = `if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = (keyboardHeight + 80) + 'px';
        }`;
html = html.replace(oldHandlerRegex, newHandler);

const oldHandlerCloseRegex = /if \(replyBox && replyBox\.style\.display !== 'none'\) \{\s*replyBox\.style\.bottom = 'calc\(max\(20px, env\(safe-area-inset-bottom\)\) \+ 56px\)';\s*\}/;
const newHandlerClose = `if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = 'calc(max(20px, env(safe-area-inset-bottom)) + 80px)';
        }`;
html = html.replace(oldHandlerCloseRegex, newHandlerClose);

fs.writeFileSync('index.html', html);
console.log("✅ Floating neon reply applied!");
