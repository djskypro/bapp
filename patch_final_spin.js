const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the chat list and UI to sit IN FRONT of the background
const safeCSS = `
  /* Force UI to the front */
  #main-view {
    z-index: 10;
  }
  .chat-list {
    position: relative;
    z-index: 99 !important;
    display: flex;
    flex-direction: column;
  }
  .chat-item {
    position: relative;
    z-index: 100 !important;
  }
  .header, .search-container, .bottom-nav {
    z-index: 100 !important;
  }
</style>
`;
// Append to the end of the CSS styles
html = html.replace('</style>', safeCSS);

// 2. Fix the spin: Remove the crazy tumble, make it very slow
const oldSphereCSS = /\/\* The sphere itself will breathe\/grow slightly \*\/[\s\S]*?<\/style>/;
// We will replace everything from the sphere CSS to the end of the style tag
const newSphereCSS = `
  /* The sphere itself will breathe/grow slightly, NO TUMBLE */
  .snake-sphere {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 350px; height: 350px;
    border-radius: 50%;
    z-index: 0; /* Put it in the background */
    pointer-events: none;
    overflow: hidden;
    box-shadow: 
      inset 0 0 50px rgba(0,0,0,0.9), 
      inset 20px 20px 60px var(--snake-glow),
      0 0 50px var(--snake-glow);
    mask-image: radial-gradient(circle, black 40%, transparent 75%);
    -webkit-mask-image: radial-gradient(circle, black 40%, transparent 75%);
    animation: breatheSphere 6s infinite alternate ease-in-out;
  }

  .sphere-texture {
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px, 15px 15px, 0 0;
    
    /* Slow, elegant rotation */
    animation: spinSlowly 40s linear infinite;
  }

  @keyframes spinSlowly {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes breatheSphere {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
    100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }
</style>
`;
html = html.replace(oldSphereCSS, newSphereCSS);

// 3. Force load the chat list again on startup to ensure it's not empty
html = html.replace("socket.onopen = () => {", "socket.onopen = () => {\n    loadChatList();");

fs.writeFileSync('index.html', html);
console.log('✅ Chat list pushed to front and slow spin applied!');
