const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `    <div class="toggle-row">
      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px; display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">✨</span> Cinematic Animations
      </div>
      <input type="checkbox" id="settings-animations" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

const newBlock = `    <div class="toggle-row">
      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px;">Panic Mode (Shake for Calculator)</div>
      <input type="checkbox" id="settings-panic-mode" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px;">Shake to Undo Send</div>
      <input type="checkbox" id="settings-shake-undo" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px; display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">✨</span> Cinematic Animations
      </div>
      <input type="checkbox" id="settings-animations" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
}

fs.writeFileSync('index.html', html);
console.log('✅ Missing toggles added back! Save button should work now.');
