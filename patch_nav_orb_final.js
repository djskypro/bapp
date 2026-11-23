const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* 1. 3D FLOATING BOTTOM NAV */
  .bottom-nav {
    bottom: 25px !important; /* Floats a little higher */
    border-top: 2px solid rgba(255, 255, 255, 0.4) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-right: 1px solid rgba(0, 0, 0, 0.5) !important;
    border-bottom: 4px solid rgba(0, 0, 0, 0.8) !important;
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.6),
      inset 0 2px 5px rgba(255, 255, 255, 0.1),
      inset 0 -2px 5px rgba(0, 0, 0, 0.3) !important;
  }

  /* 2. CENTERED & SMALLER AI ORB */
  #bapp-ai-orb {
    left: 50% !important;
    right: auto !important;
    bottom: 110px !important; /* Lifted slightly to clear the nav */
    width: 48px !important;   /* Smaller size */
    height: 48px !important;  /* Smaller size */
    font-size: 22px !important; /* Smaller robot emoji */
    transform: translate(-50%, 0);
  }

  /* 3. FIX THE FLOAT ANIMATION TO KEEP IT IN THE CENTER */
  /* Because the orb is centered using translateX(-50%), 
     we have to update the animation to respect that. */
  @keyframes floatOrb {
    0% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, -8px); }
    100% { transform: translate(-50%, 0); }
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Bottom Nav is now 3D, and AI Orb is centered and smaller!');
