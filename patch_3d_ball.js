const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove any old ball HTML/CSS that might be conflicting
html = html.replace(/<div id="spin-ball"><\/div>/g, '');
html = html.replace(/\/\* --- THE SPINNING BALL --- \*\/[\s\S]*?<\/style>/, '</style>');
html = html.replace(/\/\* --- GUARANTEED SPINNING GLOBE --- \*\/[\s\S]*?<\/style>/, '</style>');

// 2. Inject the new HTML right inside the body, behind everything
html = html.replace('<div id="main-view" class="view active">', '<div id="main-view" class="view active">\n  <div id="sphere-3d"></div>');

// 3. Add the guaranteed 3D CSS
const ballCSS = `
  /* --- FORCE APP TO SHOW OVER BALL --- */
  .header, .search-container, .bottom-nav, .chat-list, .chat-item {
    position: relative;
    z-index: 50 !important;
  }

  /* --- 3D SPHERE --- */
  #sphere-3d {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    border-radius: 50%;
    z-index: 1; /* Behind the text, but above the background */
    pointer-events: none;
    
    /* This creates the 3D lighting effect (bright top-left, dark bottom-right) */
    background: radial-gradient(circle at 30% 30%, rgba(100, 100, 100, 0.4) 0%, transparent 60%),
                radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 1) 0%, transparent 70%);
    
    /* Strong inner shadow for depth */
    box-shadow: 
      inset -20px -20px 60px rgba(0,0,0,0.9), 
      inset 10px 10px 40px rgba(255,255,255,0.1),
      0 0 40px rgba(0,0,0,0.8);
      
    /* Fade the outer edge so it doesn't look like a hard cutout */
    mask-image: radial-gradient(circle, black 50%, transparent 85%);
    -webkit-mask-image: radial-gradient(circle, black 50%, transparent 85%);
    
    animation: breatheSphere 6s infinite alternate ease-in-out;
  }

  /* The texture inside the sphere */
  #sphere-3d::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    border-radius: 50%;
    
    /* The snake skin pattern */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(255, 255, 255, 0.2) 21%, rgba(255, 255, 255, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(255, 255, 255, 0.2) 21%, rgba(255, 255, 255, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(255, 255, 255, 0.2) 21%, rgba(255, 255, 255, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(255, 255, 255, 0.2) 21%, rgba(255, 255, 255, 0.2) 34%, transparent 35%, transparent);
    background-size: 40px 40px;
    
    /* Spin to the LEFT */
    animation: spinLeft 8s linear infinite;
  }

  /* Light mode support */
  .light-mode #sphere-3d {
    background: radial-gradient(circle at 30% 30%, rgba(200, 200, 200, 0.4) 0%, transparent 60%),
                radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 1) 0%, transparent 70%);
    box-shadow: inset -20px -20px 60px rgba(255,255,255,0.9), inset 10px 10px 40px rgba(0,0,0,0.1);
  }
  .light-mode #sphere-3d::before {
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(0, 0, 0, 0.2) 21%, rgba(0, 0, 0, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(0, 0, 0, 0.2) 21%, rgba(0, 0, 0, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(0, 0, 0, 0.2) 21%, rgba(0, 0, 0, 0.2) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(0, 0, 0, 0.2) 21%, rgba(0, 0, 0, 0.2) 34%, transparent 35%, transparent);
  }

  @keyframes spinLeft {
    0% { background-position: 0px 0px, 20px 20px, 20px 20px, 0px 0px; }
    100% { background-position: -80px 0px, -60px 20px, -60px 20px, -80px 0px; }
  }

  @keyframes breatheSphere {
    0% { transform: translate(-50%, -50%) scale(0.9); }
    100% { transform: translate(-50%, -50%) scale(1.1); }
  }
</style>
`;

html = html.replace('</style>', ballCSS);

fs.writeFileSync('index.html', html);
console.log('✅ True 3D sphere added and spinning left!');
