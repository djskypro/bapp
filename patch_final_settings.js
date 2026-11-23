const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Ensure settings-content forces scroll
html = html.replace('.settings-content { padding: 20px; flex: 1; overflow-y: auto; }', '.settings-content { padding: 20px; flex: 1; overflow-y: auto !important; display: flex; flex-direction: column; gap: 15px; padding-bottom: 100px; }');

// 2. Remove the broken dim block from inside the Reset button
const brokenDim = `<div class="toggle-row" onclick="toggleDimWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">                    <div>                                <label style="font-size:16px; font-weight:bold; color:var(--text);">🌑 Dim Wallpaper</label>             <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Darken the wallpaper so messages are easier to read</div>           </div>                             <label class="switch">               <input type="checkbox" id="dim-wallpaper-toggle" onchange="toggleDimWallpaper()">                        <span class="slider round"></span>                                  </label>                         </div>`;
html = html.replace(brokenDim, '');

// 3. Add the clean dim block right before the Reset button
const resetMarker = `<!-- RESET WALLPAPER -->`;
const cleanDim = `
    <!-- DIM WALLPAPER -->
    <div class="toggle-row" onclick="toggleDimWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🌑 Dim Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Darken the wallpaper so messages are easier to read</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="dim-wallpaper-toggle" onchange="toggleDimWallpaper()">
        <span class="slider round"></span>
      </label>
    </div>
    
    <!-- RESET WALLPAPER -->`;

html = html.replace(resetMarker, cleanDim);

fs.writeFileSync('index.html', html);
console.log("✅ Settings scrolling and Dim layout fixed!");
