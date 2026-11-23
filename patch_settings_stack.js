const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a specific class to the containers so we can target them cleanly
html = html.replace('onclick="document.getElementById(\'app-wallpaper-input\').click()"', 'class="settings-row-btn" onclick="document.getElementById(\'app-wallpaper-input\').click()"');
html = html.replace('onclick="document.getElementById(\'app-slideshow-input\').click()"', 'class="settings-row-btn" onclick="document.getElementById(\'app-slideshow-input\').click()"');
html = html.replace('onclick="resetWallpaper()"', 'class="settings-row-btn" onclick="resetWallpaper()"');

// 2. Add CSS to force them to stack and take full width
const css = `
<style>
  .settings-row-btn {
    display: flex !important;
    flex-direction: row !important; /* Keep icon/text side by side */
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    margin-bottom: 15px !important;
    flex-wrap: nowrap !important;
  }
  /* Ensure the settings container stacks them */
  .settings-content {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
  }
</style>
</head>`;
html = html.replace('</head>', css);

fs.writeFileSync('index.html', html);
console.log("✅ Settings forced to stack vertically!");
