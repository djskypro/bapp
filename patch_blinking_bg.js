const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the old static background
const hideOldBgCSS = `
<style>
  #magic-ball, .snake-bg, .snake-sphere {
    display: none !important;
  }
  /* The new canvas layer */
  #bg-canvas {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: 0;
    pointer-events: none;
  }
</style>
</head>
`;
html = html.replace('</head>', hideOldBgCSS);

// 2. Inject the Canvas HTML at the start of the body
html = html.replace('<body>', '<body>\n<canvas id="bg-canvas"></canvas>');

// 3. Add the Canvas animation logic
const canvasJS = `
  // --- BLINKING CANVAS BACKGROUND ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dots = [];
  const SPACING = 40; // Distance between circles
  const RADIUS = 12;  // Size of circles

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDots();
  }

  function initDots() {
    dots = [];
    for (let x = SPACING; x < canvas.width; x += SPACING) {
      for (let y = SPACING; y < canvas.height; y += SPACING) {
        dots.push({
          x: x,
          y: y,
          baseAlpha: 0.05, // Very faint base opacity
          currentAlpha: 0.05,
          state: 'idle', // 'idle', 'fadingOut', 'fadingIn'
          speed: 0
        });
      }
    }
  }

  function animateBackground() {
    requestAnimationFrame(animateBackground);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Randomly pick 1 or 2 dots to start fading out
    if (Math.random() > 0.95) {
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      if (randomDot.state === 'idle') {
        randomDot.state = 'fadingOut';
        randomDot.speed = Math.random() * 0.02 + 0.01; // Random fade speed
      }
    }

    // Draw and update each dot
    dots.forEach(dot => {
      // Update state
      if (dot.state === 'fadingOut') {
        dot.currentAlpha -= dot.speed;
        if (dot.currentAlpha <= 0) {
          dot.currentAlpha = 0;
          dot.state = 'waitingToFadeIn';
          dot.waitTime = Date.now() + (Math.random() * 2000 + 1000); // Wait 1-3 seconds
        }
      } else if (dot.state === 'waitingToFadeIn') {
        if (Date.now() > dot.waitTime) {
          dot.state = 'fadingIn';
        }
      } else if (dot.state === 'fadingIn') {
        dot.currentAlpha += dot.speed;
        if (dot.currentAlpha >= dot.baseAlpha) {
          dot.currentAlpha = dot.baseAlpha;
          dot.state = 'idle';
        }
      }

      // Draw the circle (dark grey scales)
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = \`rgba(255, 255, 255, \${dot.currentAlpha})\`;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Optional: slight inner glow
      if (dot.currentAlpha > 0.03) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, RADIUS - 3, 0, Math.PI * 2);
          ctx.fillStyle = \`rgba(255, 255, 255, \${dot.currentAlpha / 2})\`;
          ctx.fill();
      }
    });
  }

  // Initialize and start
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateBackground();
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + canvasJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Canvas blinking background successfully injected!');
} else {
    console.log('❌ Could not find script tag.');
}
