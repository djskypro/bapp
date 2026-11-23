const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the ghost button from the chat header
html = html.replace(/<div id="ghost-toggle"[\s\S]*?<\/div>/, '');

// 2. Add the Ghost Mode toggle to the Settings view
// We look for the opening of the settings content and inject it right after
const settingsToggleHTML = `
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
`;
html = html.replace('<div class="settings-content">', `<div class="settings-content">\n${settingsToggleHTML}`);

// 3. Add CSS for the toggle switch (if you don't have it already)
const toggleCSS = `
<style>
  .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; border-radius: 34px; }
  .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
  input:checked + .slider { background-color: var(--primary); }
  input:checked + .slider:before { transform: translateX(22px); }
</style>
</head>`;
html = html.replace('</head>', toggleCSS);

// 4. Update the JS so it syncs with the checkbox instead of the header button
const oldGhostJsRegex = /window\.ghostMode = localStorage\.getItem\('bapp_ghost_mode'\) === 'true';[\s\S]*?setTimeout\(updateGhostUI, 1000\);/;
const newGhostJs = `
  window.ghostMode = localStorage.getItem('bapp_ghost_mode') === 'true';
  
  function toggleGhostMode() {
    const toggle = document.getElementById('ghost-mode-toggle');
    window.ghostMode = toggle ? toggle.checked : !window.ghostMode;
    localStorage.setItem('bapp_ghost_mode', window.ghostMode);
  }
  
  // Sync checkbox on load
  setTimeout(() => {
    const toggle = document.getElementById('ghost-mode-toggle');
    if (toggle) toggle.checked = window.ghostMode;
  }, 1000);
`;
html = html.replace(oldGhostJsRegex, newGhostJs);

fs.writeFileSync('index.html', html);
console.log("✅ Ghost Mode moved to Settings!");
