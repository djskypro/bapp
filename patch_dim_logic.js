const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a dark overlay div right after the body tag
const overlayHTML = `<div id="dim-overlay" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:1; pointer-events:none; display:none;"></div>`;
if (!html.includes('id="dim-overlay"')) {
    html = html.replace('<body>', '<body>\n' + overlayHTML);
}

// 2. Add the toggle logic
const dimJS = `
<script>
  function toggleDimWallpaper() {
    const toggle = document.getElementById('dim-wallpaper-toggle');
    const overlay = document.getElementById('dim-overlay');
    
    if (toggle && toggle.checked) {
      localStorage.setItem('bapp_dim_wallpaper', 'true');
      if (overlay) overlay.style.display = 'block';
    } else {
      localStorage.setItem('bapp_dim_wallpaper', 'false');
      if (overlay) overlay.style.display = 'none';
    }
  }

  // Load the dim setting on startup
  document.addEventListener('DOMContentLoaded', () => {
    const isDimmed = localStorage.getItem('bapp_dim_wallpaper') === 'true';
    const toggle = document.getElementById('dim-wallpaper-toggle');
    const overlay = document.getElementById('dim-overlay');
    
    if (isDimmed) {
      if (toggle) toggle.checked = true;
      if (overlay) overlay.style.display = 'block';
    }
  });
</script>
`;
html = html.replace('</body>', dimJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Dim Wallpaper feature added!");
