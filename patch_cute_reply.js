const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* --- CUTE ATTACHED REPLY PREVIEW --- */
  #reply-preview {
    bottom: max(75px, calc(env(safe-area-inset-bottom) + 75px)) !important; /* Sits right on top of the input bar */
    left: 25px !important;  /* Matches input bar */
    right: 25px !important; /* Matches input bar */
    border-radius: 18px 18px 0 0 !important; /* Curved top, flat bottom */
    border: 1px solid var(--glass-border) !important;
    border-bottom: none !important; /* Blends into the input bar */
    border-left: 4px solid var(--primary) !important; /* Nice green accent */
    padding: 6px 12px !important; /* Half the size */
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
  }

  /* Make the close 'X' button a bit smaller */
  #reply-preview span {
    font-size: 14px !important;
    opacity: 0.7;
  }
  #reply-preview span:active {
    opacity: 1;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Reply badge is now cute, half-sized, and attached to the input bar!');
