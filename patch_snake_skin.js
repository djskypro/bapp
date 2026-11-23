const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. RESTORE THE COLORED SEARCH BAR
const normalSearch = `<div class="search-box">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
    </div>`;

const glowingSearch = `<div class="search-glow-wrapper">
      <div class="search-glow"></div>
      <div class="search-box-inner">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
      </div>
    </div>`;

if(html.includes(normalSearch)) {
    html = html.replace(normalSearch, glowingSearch);
}

// 2. REPLACE THE BACKGROUND CSS WITH BRIGHTER SNAKE SKIN
// Remove the old bg-glow CSS
const oldBgCSS = /\/\* BACKGROUND STARDUST GLOW \*\/[\s\S]*?<\/style>/;
const newBgCSS = `
  /* COLORED SEARCH BAR GLOW */
  .search-glow-wrapper {
    position: relative;
    padding: 2px;
    border-radius: 14px;
    display: flex;
    width: 100%;
  }
  .search-glow {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: radial-gradient(circle at 10% 50%, rgba(37, 211, 102, 0.8) 0%, transparent 40%),
                radial-gradient(circle at 90% 50%, rgba(0, 150, 255, 0.8) 0%, transparent 40%),
                radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 6px 6px;
    animation: geminiPulse 3s infinite alternate;
    z-index: 0;
  }
  .search-box-inner {
    width: 100%;
    position: relative;
    z-index: 1;
    background: rgba(15, 15, 20, 0.95);
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 10px 15px;
    gap: 10px;
  }
  .search-box-inner input {
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 16px;
    width: 100%;
    outline: none;
  }
  @keyframes geminiPulse {
    0% { opacity: 0.5; filter: blur(1px); transform: scale(0.98); }
    100% { opacity: 1; filter: blur(3px); transform: scale(1.02); }
  }

  /* SNAKE SKIN BACKGROUND */
  #main-view {
    position: absolute;
    overflow: hidden;
  }
  .bg-snake {
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    /* This CSS creates the overlapping scale pattern */
    background-image: 
      radial-gradient(circle at 100% 150%, transparent 20%, rgba(255,255,255,0.4) 21%, rgba(255,255,255,0.4) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0% 150%, transparent 20%, rgba(255,255,255,0.4) 21%, rgba(255,255,255,0.4) 34%, transparent 35%, transparent);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
    z-index: 0;
    pointer-events: none;
    animation: bgGrow 6s infinite alternate ease-in-out;
    /* Fade out the edges */
    mask-image: radial-gradient(circle at center, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 70%);
  }

  @keyframes bgGrow {
    0% { transform: scale(0.9); opacity: 0.3; filter: blur(1px); }
    100% { transform: scale(1.1); opacity: 0.8; filter: blur(3px); }
  }

  /* Ensure UI elements sit on top of the glow */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace(oldBgCSS, newBgCSS);

// 3. UPDATE THE HTML TO USE THE SNAKE CLASS
html = html.replace('<div class="bg-glow"></div>', '<div class="bg-snake"></div>');

fs.writeFileSync('index.html', html);
console.log('✅ Colored search restored and Snake Skin background added!');
