const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact broken block: from the old Dim button start to the end of the Reset button
const oldBlock = `<!-- RESET WALLPAPER -->           <div class="toggle-row" onclick="resetWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">                      <div class="toggle-row" onclick="toggleDimWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">                    <div>                                <label style="font-size:16px; font-weight:bold; color:var(--text);">🔄 Reset Wallpaper</label>           <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Go back to the default background</div>                             </div>                             <div style="color:var(--primary); font-size:20px;">↺</div>          </div>`;

const newBlock = `<!-- RESET WALLPAPER -->
    <div class="toggle-row" onclick="resetWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🔄 Reset Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Go back to the default background</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">↺</div>
    </div>`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Reset button cleaned up and old Dim removed!");
} else {
    console.log("❌ Could not find the exact broken block. Let's check spacing.");
}
