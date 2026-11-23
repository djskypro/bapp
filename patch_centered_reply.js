const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* --- PERFECTLY CENTERED TOP REPLY BADGE --- */
  #reply-preview {
    /* Center it horizontally */
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: 65% !important; /* Nice, cute size */
    max-width: 300px !important;
    
    /* Sit exactly on top of the input bar */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 62px) !important; 
    
    /* Visual styling: round top, flat bottom */
    border-radius: 15px 15px 0 0 !important; 
    border: 1px solid var(--glass-border) !important;
    border-bottom: none !important; /* Blends perfectly with the input box top */
    border-left: 4px solid var(--primary) !important;
    
    padding: 6px 12px !important; 
    margin-bottom: 0 !important; /* Removed the negative margin so it doesn't go inside */
    box-shadow: 0 -4px 15px rgba(0,0,0,0.2) !important;
    z-index: 999 !important;
  }

  /* Make the text smaller */
  #reply-preview strong {
    font-size: 11px !important;
    color: var(--primary) !important;
  }
  
  .reply-preview-text {
    font-size: 11px !important;
    margin-top: 2px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* The close 'X' */
  #reply-preview span {
    font-size: 14px !important;
    opacity: 0.7;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Reply badge is now centered on top of the input bar!');
