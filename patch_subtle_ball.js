const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old magic-ball CSS block
const oldCSSStart = html.indexOf('  #magic-ball {');
const oldCSSEnd = html.indexOf('</style>', oldCSSStart);
// Find the start of the style tag we injected
const styleStart = html.lastIndexOf('<style>', oldCSSStart);

if (styleStart !== -1 && oldCSSStart !== -1) {
    html = html.substring(0, styleStart) + html.substring(oldCSSEnd);
}

// 2. Add the new, perfectly blended dark texture
const newCSS = `
  <style>
  /* Ensure app sits on top */
  .header, .search-container, .chat-list, .bottom-nav { position: relative; z-index: 10; }

  /* THE DARK BLENDED SPHERE */
  #magic-ball {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; /* Made it huge so it feels like a background wall */
    height: 600px;
    border-radius: 50%;
    z-index: 0; 
    pointer-events: none;
    
    /* Extremely dark 3D lighting */
    background: radial-gradient(circle at 30% 30%, #0a0a0a 0%, #000 80%);
    
    /* Fade the edges completely into the black background so there are no borders */
    mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
    -webkit-mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
  }

  /* The subtle dark snake skin texture */
  #magic-ball::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    
    /* Dark grey overlapping scales */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(255, 255, 255, 0.04) 21%, rgba(255, 255, 255, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(255, 255, 255, 0.04) 21%, rgba(255, 255, 255, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(255, 255, 255, 0.04) 21%, rgba(255, 255, 255, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(255, 255, 255, 0.04) 21%, rgba(255, 255, 255, 0.04) 34%, transparent 35%, transparent);
    background-size: 25px 25px; /* Smaller, tighter scales */
    
    /* Spin to the left */
    animation: spinLeft 15s linear infinite;
  }

  /* Light mode support */
  .light-mode #magic-ball {
    background: radial-gradient(circle at 30% 30%, #f0f0f0 0%, #e0e0e0 80%);
  }
  .light-mode #magic-ball::before {
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(0, 0, 0, 0.04) 21%, rgba(0, 0, 0, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(0, 0, 0, 0.04) 21%, rgba(0, 0, 0, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(0, 0, 0, 0.04) 21%, rgba(0, 0, 0, 0.04) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(0, 0, 0, 0.04) 21%, rgba(0, 0, 0, 0.04) 34%, transparent 35%, transparent);
  }

  @keyframes spinLeft {
    0% { background-position: 0px 0px, 12.5px 12.5px, 12.5px 12.5px, 0px 0px; }
    100% { background-position: -50px 0px, -37.5px 12.5px, -37.5px 12.5px, -50px 0px; }
  }
  </style>
</head>
`;

// Insert right before </head>
html = html.replace('</head>', newCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Dark, blended snake texture applied!');
