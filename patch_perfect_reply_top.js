const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove all previous #reply-preview CSS rules to prevent conflicts
html = html.replace(/#reply-preview \{[\s\S]*?\}/g, '');
html = html.replace(/\.reply-preview-text \{[\s\S]*?\}/g, '');
html = html.replace(/#reply-preview strong \{[\s\S]*?\}/g, '');

// 2. Add the perfect, mathematically calculated CSS at the end of the head
const perfectCSS = `
<style>
  /* --- PERFECTLY ATTACHED REPLY BADGE --- */
  #reply-preview {
    position: absolute !important;
    
    /* 20px (bottom of box) + 65px (height of box) = exactly the top edge */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 65px) !important; 
    
    /* Center it perfectly */
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 65% !important; 
    max-width: 300px !important;
    
    /* Attach it to the top */
    border-radius: 12px 12px 0 0 !important;
    border: 1px solid var(--glass-border) !important;
    border-bottom: none !important; 
    border-left: 4px solid var(--primary) !important;
    
    background: var(--glass-bg) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
    
    padding: 6px 12px !important; 
    margin: 0 !important; 
    box-shadow: 0 -4px 15px rgba(0,0,0,0.2) !important;
    z-index: 1001 !important; /* Sits above the input box */
  }

  /* Text styling inside the badge */
  #reply-preview strong {
    font-size: 11px !important;
    color: var(--primary) !important;
  }
  
  .reply-preview-text {
    font-size: 11px !important;
    color: var(--text-muted) !important;
    margin-top: 2px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* The close 'X' button */
  #reply-preview span {
    font-size: 14px !important;
    opacity: 0.7;
    cursor: pointer;
  }
</style>
</head>
`;

html = html.replace('</head>', perfectCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Reply badge is now mathematically perfectly attached to the top of the input box!');
