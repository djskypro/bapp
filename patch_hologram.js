const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the 3D Hologram CSS
const holoCSS = `
<style>
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
</style>
</head>
`;
html = html.replace('</head>', holoCSS);

// 2. Add the Gyroscope JS
const holoJS = `
  // --- HOLOGRAM GYROSCOPE EFFECT ---
  let holoX = 0;
  let holoY = 0;

  window.addEventListener('deviceorientation', function(e) {
    // Only run if the chat view is active
    if (!document.getElementById('chat-view').classList.contains('active')) return;
    
    // Get the tilt values (beta = front/back, gamma = left/right)
    const beta = e.beta || 0; 
    const gamma = e.gamma || 0;
    
    // Limit the tilt to a max of 10 degrees so it doesn't break the UI
    holoX = Math.max(Math.min(beta / 4, 10), -10);
    holoY = Math.max(Math.min(gamma / 4, 10), -10);

    const header = document.querySelector('.chat-header');
    const inputArea = document.querySelector('.chat-input-area');

    if (header && inputArea) {
        // The header tilts more, the input tilts less (parallax effect)
        header.style.transform = \`rotateX(\${holoX}deg) rotateY(\${holoY}deg) translateZ(50px)\`;
        inputArea.style.transform = \`rotateX(\${holoX}deg) rotateY(\${holoY}deg) translateZ(20px)\`;
    }
  });

  // Reset the tilt when you leave the chat
  const originalGoBack = window.goBack;
  window.goBack = function() {
    const header = document.querySelector('.chat-header');
    const inputArea = document.querySelector('.chat-input-area');
    if (header) header.style.transform = 'none';
    if (inputArea) inputArea.style.transform = 'none';
    if (typeof originalGoBack === 'function') originalGoBack();
  };
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + holoJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Hologram 3D Gyroscope effect added perfectly!');
} else {
    console.log('❌ Could not find script tag.');
}
