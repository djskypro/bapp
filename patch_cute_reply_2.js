const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* --- HALF-WIDTH ATTACHED REPLY BADGE --- */
  #reply-preview {
    /* Position it perfectly on top of the input bar */
    bottom: calc(max(20px, env(safe-area-inset-bottom)) + 64px) !important; 
    
    left: 25px !important; 
    width: 55% !important;  /* HALF THE WIDTH */
    right: auto !important; /* Remove the right constraint */
    
    border-radius: 15px 15px 0 0 !important; /* Curved top, flat bottom */
    border: 1px solid var(--glass-border) !important;
    border-bottom: none !important; /* Blends into the input bar */
    border-left: 4px solid var(--primary) !important; /* Nice green accent */
    
    padding: 6px 12px !important; 
    margin-bottom: -2px !important; /* Tucks it slightly behind the input board */
    box-shadow: 0 -4px 15px rgba(0,0,0,0.2) !important;
    z-index: 999 !important;
  }

  /* Make the text smaller and cuter */
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

  /* Make the close 'X' button a bit smaller */
  #reply-preview span {
    font-size: 14px !important;
    opacity: 0.7;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Reply badge is now half-width and perfectly attached to the input bar!');
