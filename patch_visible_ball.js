const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Clean up any old broken ball divs
html = html.replace(/<div id="sphere-3d"><\/div>/g, '');
html = html.replace(/<div id="spin-ball"><\/div>/g, '');
html = html.replace(/<div id="magic-ball"><\/div>/g, '');

// 2. Force insert the ball right after the <body> tag
html = html.replace(/<body[^>]*>/, '$&\n<div id="magic-ball"></div>');

// 3. Inject highly visible ball CSS
const ballCSS = `
  <style>
  /* FORCE BACKGROUND TRANSPARENCY */
  body { background-color: var(--bg) !important; }
  #main-view { background: transparent !important; }
  .header, .search-container, .chat-list, .bottom-nav { position: relative; z-index: 10; }

  /* THE 3D SPINNING BALL */
  #magic-ball {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 280px; height: 280px;
    border-radius: 50%;
    z-index: 0; 
    pointer-events: none;
    overflow: hidden;
    
    /* 3D Sphere Lighting (Grey base with bright highlight) */
    background: radial-gradient(circle at 30% 30%, #555 0%, #000 80%);
    
    /* 3D inner shadow for depth + subtle glow */
    box-shadow: 
      inset -20px -20px 50px rgba(0,0,0,1), 
      inset 10px 10px 30px rgba(255,255,255,0.2),
      0 0 30px rgba(255,255,255,0.1);
  }

  /* The spinning texture */
  #magic-ball::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    
    /* BRIGHT White Snake Scales */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent);
    background-size: 40px 40px;
    
    /* Spin to the left */
    animation: spinLeft 6s linear infinite;
  }

  /* Light Mode support */
  .light-mode #magic-ball {
    background: radial-gradient(circle at 30% 30%, #fff 0%, #999 80%);
    box-shadow: inset -20px -20px 50px rgba(255,255,255,1), inset 10px 10px 30px rgba(0,0,0,0.3);
  }
  .light-mode #magic-ball::before {
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(0,0,0,0.8) 21%, rgba(0,0,0,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(0,0,0,0.8) 21%, rgba(0,0,0,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(0,0,0,0.8) 21%, rgba(0,0,0,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(0,0,0,0.8) 21%, rgba(0,0,0,0.8) 34%, transparent 35%, transparent);
  }

  @keyframes spinLeft {
    0% { background-position: 0px 0px, 20px 20px, 20px 20px, 0px 0px; }
    100% { background-position: -80px 0px, -60px 20px, -60px 20px, -80px 0px; }
  }
  </style>
</head>
`;

// Inject right before </head>
html = html.replace('</head>', ballCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Highly visible 3D Ball injected at the root level!');
