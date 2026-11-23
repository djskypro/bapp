const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const finalCSS = `
<style>
  /* ===== STRICT REPLY PREVIEW GEOMETRY ===== */
  #reply-preview {
    position: fixed !important;
    /* Width exactly matching the input box (left 25px, right 25px) */
    left: 25px !important;
    right: 25px !important;
    width: auto !important;
    max-width: none !important;
    transform: none !important;
    
    /* Sit exactly on top of the input box */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 55px) !important;
    
    /* Curved top, flat bottom so it blends into the input */
    border-radius: 24px 24px 0 0 !important;
    
    /* Force the glass look */
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

  /* Make sure the input box has square top corners when reply is active so they attach perfectly */
  #reply-preview:not([style*="display: none"]) ~ .chat-input-area {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
  }

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
  }
</style>
</head>`;
html = html.replace('</head>', finalCSS);
fs.writeFileSync('index.html', html);
console.log("✅ Strict reply geometry applied!");
