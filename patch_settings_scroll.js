const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the Settings view to scroll and stack items vertically
const scrollCSS = `
<style>
  .settings-content {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    overflow-y: auto !important;
    padding-bottom: 100px !important; /* Space so the bottom nav doesn't hide the last button */
  }
  .toggle-row, .settings-row-btn {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    margin-bottom: 15px !important;
  }
</style>
</head>`;
if(!html.includes('.settings-content {')) {
    html = html.replace('</head>', scrollCSS);
}

// 2. Fix the broken Ghost Mode block and separate the buttons
// We will replace everything from the start of the settings-content to the reset button
const startTag = `<div class="settings-content">`;
const endTag = `<div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">`;

const startIndex = html.indexOf(startTag);
const endIndex = html.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const cleanHTML = `<div class="settings-content">
    
    <!-- GHOST MODE -->
    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">👻 Ghost Mode</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Read messages without sending blue ticks</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="ghost-mode-toggle" onchange="toggleGhostMode()">
        <span class="slider round"></span>
      </label>
    </div>

    <!-- CHAT WALLPAPER -->
    <div class="toggle-row" onclick="document.getElementById('app-wallpaper-input').click()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🖼️ Chat Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Change the background of the app</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">›</div>
      <input type="file" id="app-wallpaper-input" accept="image/*" style="display:none" onchange="uploadWallpaper(event)">
    </div>

    <!-- SLIDESHOW WALLPAPER -->
    <div class="toggle-row" onclick="document.getElementById('app-slideshow-input').click()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🎞️ Slideshow Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Select multiple pics to rotate</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">›</div>
      <input type="file" id="app-slideshow-input" accept="image/*" multiple style="display:none" onchange="uploadSlideshow(event)">
    </div>

    <!-- RESET WALLPAPER -->
    <div class="toggle-row" onclick="resetWallpaper()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">🔄 Reset Wallpaper</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Go back to the default background</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">↺</div>
    </div>

    `;

    html = html.slice(0, startIndex) + cleanHTML + html.slice(endIndex);
    fs.writeFileSync('index.html', html);
    console.log("✅ Settings menu rebuilt and scrollable!");
} else {
    console.log("❌ Could not find the start/end tags.");
}
