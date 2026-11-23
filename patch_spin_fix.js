const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the guaranteed working CSS right before the closing style tag
const newCSS = `
  /* --- FORCE CHAT LIST TO FRONT --- */
  #chat-list-container {
    position: relative;
    z-index: 50 !important;
  }
  .header, .search-container, .bottom-nav {
    z-index: 100 !important;
  }

  /* --- GUARANTEED SPINNING GLOBE --- */
  .snake-sphere {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 350px; height: 350px;
    border-radius: 50%;
    z-index: 0 !important; /* Background */
    pointer-events: none;
    overflow: hidden;
    box-shadow: inset 0 0 50px rgba(0,0,0,1), inset 20px 20px 60px var(--snake-glow);
    mask-image: radial-gradient(circle, black 30%, transparent 70%);
    -webkit-mask-image: radial-gradient(circle, black 30%, transparent 70%);
    animation: breatheSphere 4s infinite alternate ease-in-out;
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
    
    /* This creates the spinning globe effect by scrolling the texture */
    animation: spinGlobe 8s linear infinite;
  }

  @keyframes spinGlobe {
    0% { background-position: 0px 0px, 15px 15px, 15px 15px, 0px 0px; }
    100% { background-position: 60px 0px, 75px 15px, 75px 15px, 60px 0px; }
  }

  @keyframes breatheSphere {
    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
    100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }
</style>
`;

html = html.replace('</style>', newCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Spin and Chat List visibility fixed!');
