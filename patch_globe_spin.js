const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the wheel rotation with a 3D rolling background position
const oldSpinCSS = `/* Spin the texture continuously */
    animation: spinTexture 20s linear infinite;
  }

  @keyframes spinTexture {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`;

const newSpinCSS = `/* Roll the texture horizontally like a 3D globe */
    animation: rollGlobe 6s linear infinite;
  }

  /* By shifting the background position horizontally, it simulates a 3D sphere rotating */
  @keyframes rollGlobe {
    0% { background-position: 0px 0px, 15px 15px, 15px 15px, 0px 0px; }
    100% { background-position: 30px 0px, 45px 15px, 45px 15px, 30px 0px; }
  }`;

if(html.includes(oldSpinCSS)) {
    html = html.replace(oldSpinCSS, newSpinCSS);
    fs.writeFileSync('index.html', html);
    console.log('✅ Spinning globe animation fixed!');
} else {
    console.log('❌ Could not find the spin CSS to replace.');
}
