const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the old static backgrounds and style the new canvas
const hideOldBgCSS = `
<style>
  /* Hide all old background elements */
  #magic-ball, .snake-bg, .snake-sphere {
    display: none !important;
  }
  
  /* The new breathing canvas */
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

// 3. Add the Canvas animation logic (matching your exact design)
const canvasJS = `
  // --- BREATHING BACKGROUND (Canvas) ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dots = [];
  const SPACING = 25; // Matched from your CSS
  const RADIUS = 8;   // Matched from your CSS gradient size

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDots();
  }

  function initDots() {
    dots = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDist = 300; // Matched your 600px width (radius 300)

    for (let x = 0; x < canvas.width; x += SPACING) {
      for (let y = 0; y < canvas.height; y += SPACING) {
        const dist = Math.hypot(x - centerX, y - centerY);
        
        if (dist < maxDist) {
            // Smooth fade at the edges (like your mask-image)
            let maskAlpha = 1 - (dist / maxDist);
            maskAlpha = Math.pow(maskAlpha, 1.2);

            if (maskAlpha > 0.05) {
                // Base alpha matched your CSS (0.04) but slightly boosted for canvas
                let baseAlpha = 0.08 * maskAlpha; 
                
                // Check if light mode
                const isLight = document.body.classList.contains('light-mode');
                
                dots.push({
                  x: x,
                  y: y,
                  baseAlpha: baseAlpha,
                  currentAlpha: baseAlpha,
                  state: 'idle',
                  speed: 0,
                  waitTime: 0,
                  color: isLight ? '0,0,0' : '255,255,255'
                });
            }
        }
      }
    }
  }

  function animateBackground() {
    requestAnimationFrame(animateBackground);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Randomly pick a dot to start fading out
    if (Math.random() > 0.90) { // Controls how often dots blink
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      if (randomDot && randomDot.state === 'idle') {
        randomDot.state = 'fadingOut';
        randomDot.speed = Math.random() * 0.01 + 0.005; // Random fade speed
      }
    }

    // Update and draw dots
    dots.forEach(dot => {
      if (dot.state === 'fadingOut') {
        dot.currentAlpha -= dot.speed;
        if (dot.currentAlpha <= 0) {
          dot.currentAlpha = 0;
          dot.state = 'waitingToFadeIn';
          dot.waitTime = Date.now() + (Math.random() * 3000 + 500); // Wait 0.5 to 3.5 sec
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

      // Draw the ring (hollow circle)
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = \`rgba(\${dot.color}, \${dot.currentAlpha})\`;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  // Initialize and start
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateBackground();

  // Re-initialize if theme changes
  function toggleTheme() { 
    document.body.classList.toggle('light-mode'); 
    initDots(); // Re-run to change colors
  }
`;

// Replace the old toggleTheme function so it triggers the canvas color change
html = html.replace("function toggleTheme() { document.body.classList.toggle('light-mode'); }", "");

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + canvasJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Exact design replicated with breathing effect!');
} else {
    console.log('❌ Could not find script tag.');
}
