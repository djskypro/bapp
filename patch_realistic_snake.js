const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find and replace the old background CSS
const oldBgCSS = /\/\* --- THE MOVING ENTITY UNDER THE SKIN --- \*\/[\s\S]*?<\/style>/;

const newCSS = `
  /* --- REALISTIC SNAKE SKIN BACKGROUND --- */
  .snake-bg {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
    pointer-events: none;
    background-color: #0f0b07; /* Deep brown/black base */
    
    /* CSS pattern for overlapping golden scales */
    background-image: 
      radial-gradient(circle at 50% 0, #d4af37 5%, #6b4e16 15%, transparent 20%),
      radial-gradient(circle at 0 50%, #d4af37 5%, #6b4e16 15%, transparent 20%),
      radial-gradient(circle at 100% 50%, #d4af37 5%, #6b4e16 15%, transparent 20%),
      radial-gradient(circle at 50% 100%, #d4af37 5%, #6b4e16 15%, transparent 20%);
    background-size: 25px 25px;
    background-position: 0 0, 12px 12px, 12px 12px, 0 0;
    
    opacity: 0.8;
  }

  /* --- THE MOVING GLOWING "ANT" --- */
  .glow-ant {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(212, 175, 55, 0.4) 40%, transparent 70%);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
    z-index: 1;
    pointer-events: none;
    transform: translate(-50%, -50%);
    /* We will animate this with JS for random walking */
  }

  /* Ensure UI sits on top of the background */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace(oldBgCSS, newCSS);

// 2. Replace the HTML divs
html = html.replace('<div class="bg-entity"></div>', '<div class="snake-bg"></div>\n  <div class="glow-ant" id="glow-ant"></div>');

// 3. Add the Random Walking JavaScript
const antJS = `
  // --- RANDOM WANDERING ANT ---
  let antEl = document.getElementById('glow-ant');
  let antX = window.innerWidth / 2;
  let antY = window.innerHeight / 2;
  let speedX = 1;
  let speedY = 1;
  let targetX = antX;
  let targetY = antY;

  function pickNewTarget() {
    targetX = Math.random() * window.innerWidth;
    targetY = Math.random() * window.innerHeight;
  }
  pickNewTarget(); // Pick first target

  function moveAnt() {
    const dx = targetX - antX;
    const dy = targetY - antY;
    const distance = Math.hypot(dx, dy);

    if (distance < 10) {
      pickNewTarget(); // Reached the target, pick a new one
    } else {
      // Move towards target slowly
      const speed = 1.5; 
      antX += (dx / distance) * speed;
      antY += (dy / distance) * speed;
      
      // Apply position
      antEl.style.left = antX + 'px';
      antEl.style.top = antY + 'px';
    }

    requestAnimationFrame(moveAnt);
  }
  
  // Start the walk after a short delay
  setTimeout(moveAnt, 1000);

  // Make sure it re-calculates targets if screen resizes
  window.addEventListener('resize', () => {
    if(antX > window.innerWidth) antX = window.innerWidth / 2;
    if(antY > window.innerHeight) antY = window.innerHeight / 2;
  });

</script>
`;

// Inject the JS right before the closing script tag
html = html.replace('</script>', antJS);

fs.writeFileSync('index.html', html);
console.log('✅ Realistic golden snake skin and wandering glow ant added!');
