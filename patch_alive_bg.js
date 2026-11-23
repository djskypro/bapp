const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix Screen Layout & Remove the old static snake pattern
const oldBgCSS = /\/\* SNAKE SKIN BACKGROUND \*\/[\s\S]*?<\/style>/;
const newCSS = `
  /* --- FIX SCREEN FIT --- */
  html, body {
    height: 100dvh;
    width: 100vw;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #050505;
  }
  #main-view {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: 0;
  }
  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 90px; /* Space for floating nav */
  }

  /* --- THE MOVING ENTITY UNDER THE SKIN --- */
  .bg-entity {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    /* Wandering animation across the screen */
    animation: wander 18s infinite ease-in-out, pulse 4s infinite alternate;
    opacity: 0.7;
  }

  /* The snake skin texture inside the moving entity */
  .bg-entity::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 100% 150%, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0% 150%, transparent 20%, rgba(255,255,255,0.8) 21%, rgba(255,255,255,0.8) 34%, transparent 35%, transparent);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px;
    border-radius: 50%;
    
    /* Fade the scales out at the edges so it blends into the dark */
    mask-image: radial-gradient(circle, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(circle, black 20%, transparent 70%);
  }

  /* The glowing light inside the entity */
  .bg-entity::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(37, 211, 102, 0.4) 0%, rgba(0, 150, 255, 0.2) 40%, transparent 70%);
    border-radius: 50%;
  }

  @keyframes wander {
    0% { top: -10%; left: -10%; transform: scale(0.8); }
    25% { top: 50%; left: 20%; transform: scale(1.1); }
    50% { top: 10%; left: 70%; transform: scale(0.9); }
    75% { top: 70%; left: 60%; transform: scale(1.2); }
    100% { top: -10%; left: -10%; transform: scale(0.8); }
  }

  @keyframes pulse {
    0% { filter: blur(2px); opacity: 0.5; }
    100% { filter: blur(8px); opacity: 1; }
  }

  /* Ensure UI sits on top */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace(oldBgCSS, newCSS);

// 2. Replace the old background div with the new moving entity
html = html.replace('<div class="bg-snake"></div>', '<div class="bg-entity"></div>');

fs.writeFileSync('index.html', html);
console.log('✅ Screen fit fixed and the Moving Snake-Skin Entity is alive!');
