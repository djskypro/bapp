const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the snake sphere HTML
html = html.replace(/<div class="snake-sphere">[\s\S]*?<\/div><\/div>/g, '');
html = html.replace(/<div class="snake-bg"><\/div>/g, '');
html = html.replace(/<div class="glow-ant" id="glow-ant"><\/div>/g, '');
html = html.replace(/<div class="bg-entity"><\/div>/g, '');

// 2. Remove all the messy background CSS
// Remove the sphere block
html = html.replace(/\/\* --- GUARANTEED SPINNING GLOBE --- \*\/[\s\S]*?<\/style>/, '</style>');
// Remove the snake bg block
html = html.replace(/\/\* --- REALISTIC SNAKE SKIN BACKGROUND --- \*\/[\s\S]*?<\/style>/, '</style>');

// 3. Ensure the main app fits perfectly and scrolls properly
const fixLayoutCSS = `
  /* FIX LAYOUT */
  #main-view {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
  }
  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 90px;
    z-index: 10;
  }
</style>
`;
html = html.replace('</style>', fixLayoutCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Background animations removed and layout fixed!');
