const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* 1. PUT AI ORB BACK ON THE RIGHT */
  #bapp-ai-orb {
    left: auto !important;
    right: 25px !important;
    bottom: 130px !important; /* Keep it lifted */
    width: 50px !important;
    height: 50px !important;
    font-size: 24px !important;
    transform: translateY(0); /* Reset any centering */
  }
  
  /* Restore the floating animation for the right side */
  @keyframes floatOrb {
    0% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0); }
  }

  /* 2. MAKE BOTTOM NAV SMALL, CENTERED, AND 3D */
  .bottom-nav {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important; /* Centers it perfectly */
    width: 85% !important; /* Makes it shorter */
    max-width: 320px !important;
    bottom: 20px !important; /* Floats just a bit */
    padding: 8px 10px !important; /* Smaller padding */
    
    /* 3D Glass Slab Effect */
    border-top: 2px solid rgba(255, 255, 255, 0.4) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-right: 1px solid rgba(0, 0, 0, 0.5) !important;
    border-bottom: 4px solid rgba(0, 0, 0, 0.8) !important;
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.6),
      inset 0 2px 5px rgba(255, 255, 255, 0.1),
      inset 0 -2px 5px rgba(0, 0, 0, 0.3) !important;
  }

  /* Make the nav icons and text smaller to fit the smaller pill */
  .nav-item span {
    font-size: 18px !important;
  }
  .nav-item {
    font-size: 10px !important;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Nav is now a small centered 3D pill, and AI orb is back on the right!');
