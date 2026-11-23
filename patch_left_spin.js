const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the HTML for the ball right inside the main view
if (!html.includes('id="spin-ball"')) {
  html = html.replace('<div id="main-view" class="view active">', '<div id="main-view" class="view active">\n  <div id="spin-ball"></div>');
}

// 2. Add the CSS for the ball and force the chat list to the front
const ballCSS = `
  /* --- FIX LAYERING --- */
  #main-view { position: relative; overflow: hidden; }
  .header, .search-container, .bottom-nav { position: relative; z-index: 100 !important; }
  .chat-list { position: relative; z-index: 50 !important; }

  /* --- THE SPINNING BALL --- */
  #spin-ball {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 320px; height: 320px;
    border-radius: 50%;
    z-index: 1; /* Behind chats, above background */
    pointer-events: none;
    overflow: hidden;
    
    /* Dark 3D shading to make it look like a sphere */
    box-shadow: inset 0 0 50px rgba(0,0,0,1), inset 20px 20px 60px var(--snake-glow);
    
    /* Fade edges perfectly into the background */
    mask-image: radial-gradient(circle, black 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(circle, black 30%, transparent 75%);
    
    /* Breathing animation */
    animation: breathe 6s infinite alternate ease-in-out;
  }

  /* The actual texture that spins */
  #spin-ball::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    
    /* Monochrome snake skin pattern */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent);
    background-size: 30px 30px;
    
    /* Spin to the LEFT (negative pixels) */
    animation: spinLeft 12s linear infinite;
  }

  @keyframes spinLeft {
    0% { background-position: 0px 0px, 15px 15px, 15px 15px, 0px 0px; }
    100% { background-position: -60px 0px, -45px 15px, -45px 15px, -60px 0px; }
  }

  @keyframes breathe {
    0% { transform: translate(-50%, -50%) scale(0.95); }
    100% { transform: translate(-50%, -50%) scale(1.05); }
  }
</style>
`;

// Add variables to root and light mode just in case they got removed
html = html.replace(':root {', ':root {\n    --snake-color: rgba(255, 255, 255, 0.15);\n    --snake-glow: rgba(255, 255, 255, 0.05);');
html = html.replace('.light-mode {', '.light-mode {\n    --snake-color: rgba(0, 0, 0, 0.15);\n    --snake-glow: rgba(0, 0, 0, 0.05);');

html = html.replace('</style>', ballCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Ball added and spinning left!');
