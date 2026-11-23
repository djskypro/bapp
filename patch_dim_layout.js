const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The broken block with Dim inside Reset
const brokenBlock = `<!-- RESET WALLPAPER -->           <div class="toggle-row" onclick="resetWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">                      <div class="toggle-row" onclick="toggleDimWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">                    <div>                                <label style="font-size:16px; font-weight:bold; color:var(--text);">🌑 Dim Wallpaper</label>             <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Darken the wallpaper so messages are easier to read</div>           </div>                             <label class="switch">               <input type="checkbox" id="dim-wallpaper-toggle" onchange="toggleDimWallpaper()">                        <span class="slider round"></span>                                  </label>                         </div>                               <div>                                <label style="font-size:16px; font-weight:bold; color:var(--text);">🔄 Reset Wallpaper</label>           <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Go back to the default background</div>                             </div>                             <div style="color:var(--primary); font-size:20px;">↺</div>`;

const fixedBlock = `<!-- DIM WALLPAPER -->
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

    <!-- RESET WALLPAPER -->
    <div class="toggle-row" onclick="resetWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🔄 Reset Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Go back to the default background</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">↺</div>`;

if (html.includes(brokenBlock)) {
    html = html.replace(brokenBlock, fixedBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Dim Wallpaper moved above Reset Wallpaper!");
} else {
    console.log("❌ Could not find the exact broken block. Let's check the spacing.");
}
