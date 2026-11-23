const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the missing </div> for Ghost Mode and the duplicate class on Wallpaper
const brokenGhost = `<input type="checkbox" id="ghost-mode-toggle" onchange="toggleGhostMode()">                         <span class="slider round"></span>              </label>                                        <div class="toggle-row" class="settings-row-btn"`;
const fixedGhost = `<input type="checkbox" id="ghost-mode-toggle" onchange="toggleGhostMode()">                         <span class="slider round"></span>              </label>                                        </div> <!-- CLOSE GHOST MODE -->                                        <div class="settings-row-btn"`;

if (html.includes(brokenGhost)) {
    html = html.replace(brokenGhost, fixedGhost);
}

// 2. Remove the duplicate class attribute on the Wallpaper button
html = html.replace('class="toggle-row" class="settings-row-btn"', 'class="settings-row-btn"');

// 3. Add CSS to force stacking
const css = `
<style>
  .settings-row-btn {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    margin-bottom: 15px !important;
  }
</style>
</head>`;
if(!html.includes('.settings-row-btn {')) {
    html = html.replace('</head>', css);
}

fs.writeFileSync('index.html', html);
console.log("✅ Settings layout rebuilt successfully!");
