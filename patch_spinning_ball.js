const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the wandering ant JavaScript completely
const oldJS = /\/\/ --- RANDOM WANDERING ANT ---[\s\S]*?setTimeout\(moveAnt, 500\);/;
html = html.replace(oldJS, '// Background is now a spinning CSS sphere.');

// 2. Update the CSS for the spinning sphere
const oldBgCSS = /\/\* --- THE REVEALING ENTITY \(The Ant\/Flashlight\) --- \*\/[\s\S]*?<\/style>/;

const newCSS = `
  /* --- THE SPINNING SNAKE SPHERE --- */
  .snake-sphere {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    border-radius: 50%;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    
    /* Create the 3D sphere lighting effect */
    box-shadow: 
      inset 0 0 50px rgba(0,0,0,0.9), 
      inset 20px 20px 60px var(--snake-glow),
      0 0 50px var(--snake-glow);
      
    /* Fade the edges into the black background */
    mask-image: radial-gradient(circle, black 40%, transparent 75%);
    -webkit-mask-image: radial-gradient(circle, black 40%, transparent 75%);
    
    /* The sphere itself will breathe/grow slightly */
    animation: breatheSphere 4s infinite alternate ease-in-out;
  }

  /* The actual spinning snake texture inside the sphere */
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
    
    /* Spin the texture continuously */
    animation: spinTexture 20s linear infinite;
  }

  @keyframes spinTexture {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes breatheSphere {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }

  /* Ensure UI sits on top */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace(oldBgCSS, newCSS);

// 3. Update the HTML divs
html = html.replace(
  '<div class="glow-ant" id="glow-ant"></div>', 
  '<div class="snake-sphere"><div class="sphere-texture"></div></div>'
);

fs.writeFileSync('index.html', html);
console.log('✅ Spinning Snake Sphere added!');
