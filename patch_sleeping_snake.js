const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old dot background and replace with the Sleeping Snake logic
const oldBgCSS = /\/\* --- REALISTIC SNAKE SKIN BACKGROUND --- \*\/[\s\S]*?<\/style>/;

const newCSS = `
  /* --- PITCH BLACK BACKGROUND --- */
  .snake-bg {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-color: #000000; /* Pure black */
    z-index: 0;
    pointer-events: none;
  }

  /* --- THE REVEALING ENTITY (The Ant/Flashlight) --- */
  .glow-ant {
    position: absolute;
    width: 300px; /* Size of the reveal area */
    height: 300px;
    border-radius: 50%;
    z-index: 1;
    pointer-events: none;
    transform: translate(-50%, -50%);
    
    /* The actual snake skin texture (monochrome scales) */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px, 15px 15px, 0 0;
    
    /* A very faint white/grey glow to reveal the scales */
    box-shadow: 0 0 50px rgba(255, 255, 255, 0.05), inset 0 0 40px rgba(255, 255, 255, 0.1);
    
    /* Fade out the edges so it smoothly blends into the black background */
    mask-image: radial-gradient(circle, black 10%, transparent 70%);
    -webkit-mask-image: radial-gradient(circle, black 10%, transparent 70%);
    
    /* Make it slowly grow and shrink while moving */
    animation: breathe 6s infinite alternate ease-in-out;
  }

  @keyframes breathe {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  }

  /* Ensure UI sits on top */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace(oldBgCSS, newCSS);

// 2. Keep the HTML the same (just the snake-bg and glow-ant divs)
// 3. Update the JavaScript to move the ant randomly and smoothly
const oldJS = /\/\/ --- RANDOM WANDERING ANT ---[\s\S]*?window.addEventListener\('resize', \(\) => \{[\s\S]*?\}\);/;

const newJS = `
  // --- RANDOM WANDERING ANT ---
  let antEl = document.getElementById('glow-ant');
  let antX = window.innerWidth / 2;
  let antY = window.innerHeight / 2;
  let targetX = antX;
  let targetY = antY;
  let speed = 1.2; // Very slow crawl

  function pickNewTarget() {
    targetX = Math.random() * window.innerWidth;
    targetY = Math.random() * window.innerHeight;
  }
  pickNewTarget();

  function moveAnt() {
    const dx = targetX - antX;
    const dy = targetY - antY;
    const distance = Math.hypot(dx, dy);

    if (distance < 5) {
      pickNewTarget(); // Reached it, go somewhere else
    } else {
      // Move slowly towards the new random point
      antX += (dx / distance) * speed;
      antY += (dy / distance) * speed;
      
      // We separate the translate because the CSS animation also uses it
      antEl.style.left = antX + 'px';
      antEl.style.top = antY + 'px';
    }

    requestAnimationFrame(moveAnt);
  }
  
  setTimeout(moveAnt, 500);
`;

html = html.replace(oldJS, newJS);

fs.writeFileSync('index.html', html);
console.log('✅ Pitch black background with the Revealing Snake Skin Ant is live!');
