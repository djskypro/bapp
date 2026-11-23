const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old search bar glow HTML and revert to normal search bar
const badSearch = `<div class="search-glow-wrapper">
      <div class="search-glow"></div>
      <div class="search-box-inner">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
      </div>
    </div>`;

const normalSearch = `<div class="search-box">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
    </div>`;

if(html.includes(badSearch)) html = html.replace(badSearch, normalSearch);

// 2. Remove the old search glow CSS
const oldCSS = /\/\* SEARCH BAR GEMINI GLOW \*\/[\s\S]*?@keyframes geminiPulse \{[\s\S]*?\}\s*\}/;
html = html.replace(oldCSS, '');

// 3. Add the new Background Glow CSS
const newCSS = `
  /* BACKGROUND STARDUST GLOW */
  #main-view {
    position: absolute;
    overflow: hidden;
  }
  .bg-glow {
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px);
    background-size: 25px 25px; /* Spaced out dots */
    z-index: 0;
    pointer-events: none;
    animation: bgGrow 5s infinite alternate ease-in-out;
    /* Fade out the edges so the dots only show in the middle */
    mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
    -webkit-mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
  }

  @keyframes bgGrow {
    0% { transform: scale(0.8); opacity: 0.2; filter: blur(1px); }
    100% { transform: scale(1.1); opacity: 0.6; filter: blur(2px); }
  }

  /* Ensure UI elements sit on top of the glow */
  .header, .search-container, .chat-list, .bottom-nav {
    position: relative;
    z-index: 2;
  }
</style>
`;
html = html.replace('</style>', newCSS);

// 4. Inject the glow div into the main view
const mainViewHTML = `<div id="main-view" class="view active">\n  <div class="bg-glow"></div>`;
html = html.replace(`<div id="main-view" class="view active">`, mainViewHTML);

fs.writeFileSync('index.html', html);
console.log('✅ Monochrome growing background glow added successfully!');
