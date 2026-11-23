const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the start and end of the canvas JS we injected earlier
const startJS = html.indexOf('// --- BLINKING CANVAS BACKGROUND ---');
const endJS = html.indexOf('</script>', startJS);

if (startJS !== -1 && endJS !== -1) {
    const newCanvasJS = `
  // --- BREATHING SPHERE CANVAS BACKGROUND ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dots = [];
  const SPACING = 35; // Distance between circles
  const RADIUS = 14;  // Size of circles

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDots();
  }

  function initDots() {
    dots = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDist = Math.max(canvas.width, canvas.height) * 0.65; // The size of the sphere

    for (let x = -SPACING; x < canvas.width + SPACING; x += SPACING) {
      for (let y = -SPACING; y < canvas.height + SPACING; y += SPACING) {
        
        // Calculate distance from the center to create the sphere mask
        const dist = Math.hypot(x - centerX, y - centerY);
        
        // Only add the dot if it's inside the sphere area
        if (dist < maxDist) {
            // Create a smooth fade at the edges of the sphere
            let maskAlpha = 1 - (dist / maxDist);
            maskAlpha = Math.pow(maskAlpha, 1.5); // Makes the fade smoother

            if (maskAlpha > 0.02) {
                dots.push({
                  x: x,
                  y: y,
                  baseAlpha: 0.15 * maskAlpha, // Base brightness
                  currentAlpha: 0.15 * maskAlpha,
                  state: 'idle', // 'idle', 'fadingOut', 'waitingToFadeIn', 'fadingIn'
                  speed: 0,
                  waitTime: 0
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
    if (Math.random() > 0.96) { // Controls how often dots blink
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      if (randomDot && randomDot.state === 'idle') {
        randomDot.state = 'fadingOut';
        randomDot.speed = Math.random() * 0.015 + 0.005; // Random fade speed
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
          dot.waitTime = Date.now() + (Math.random() * 2000 + 500); // Wait 0.5 to 2.5 seconds
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
      ctx.strokeStyle = \`rgba(255, 255, 255, \${dot.currentAlpha})\`;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  // Initialize and start
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateBackground();

`;
    html = html.substring(0, startJS) + newCanvasJS + html.substring(endJS);
    fs.writeFileSync('index.html', html);
    console.log('✅ Sphere layout with breathing rings applied!');
} else {
    console.log('❌ Could not find the canvas JS block.');
}
