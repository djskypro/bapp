const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the JavaScript movement code we just added
const jsToRemoveStart = html.indexOf('// --- HOLOGRAM GYROSCOPE EFFECT ---');
if (jsToRemoveStart !== -1) {
    const jsToRemoveEnd = html.indexOf('</script>', jsToRemoveStart);
    html = html.substring(0, jsToRemoveStart) + html.substring(jsToRemoveEnd);
}

// 2. Replace the CSS with a static 3D slab effect
const oldCSS = `
  /* Hologram 3D Setup */
  #chat-view {
    perspective: 1200px;
    overflow: hidden;
  }
  
  .chat-header, .chat-input-area {
    transform-style: preserve-3d;
    transition: transform 0.1s ease-out;
    will-change: transform;
  }

  /* Give the floating islands a 3D pop */
  .glass-island {
    transform: translateZ(30px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 20px var(--primary) inset;
  }
`;

const newCSS = `
  /* --- STATIC 3D GLASS SLABS --- */
  
  /* Give the floating islands a heavy 3D edge */
  .glass-island {
    border-top: 2px solid rgba(255, 255, 255, 0.4) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-right: 1px solid rgba(0, 0, 0, 0.5) !important;
    border-bottom: 4px solid rgba(0, 0, 0, 0.8) !important;
    box-shadow: 
      0 15px 30px rgba(0, 0, 0, 0.6),
      inset 0 2px 5px rgba(255, 255, 255, 0.1),
      inset 0 -2px 5px rgba(0, 0, 0, 0.3) !important;
    transform: translateY(-2px); /* Lifts it up visually */
  }

  /* Make the floating input bar look like a 3D pill */
  .chat-input-area {
    border-top: 2px solid rgba(255, 255, 255, 0.3) !important;
    border-bottom: 4px solid rgba(0, 0, 0, 0.8) !important;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6), inset 0 1px 3px rgba(255,255,255,0.1) !important;
    transform: translateY(-2px);
  }

  /* Make the send and mic buttons look like 3D physical buttons */
  .send-btn, .mic-btn {
    border-top: 1px solid rgba(255,255,255,0.5) !important;
    border-bottom: 3px solid rgba(0,0,0,0.5) !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4) !important;
    transform: translateY(-1px);
  }
`;

html = html.replace(oldCSS, newCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Motion removed. Static 3D glass slabs applied!');
