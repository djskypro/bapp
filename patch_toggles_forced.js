const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact button string from your output
const targetBtn = `<button class="save-btn" onclick="saveProfile()">Save Profile</button>`;

// The HTML we want to insert before it
const togglesHTML = `
    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px;">Panic Mode (Shake for Calculator)</div>
      <input type="checkbox" id="settings-panic-mode" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px;">Shake to Undo Send</div>
      <input type="checkbox" id="settings-shake-undo" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    ${targetBtn}`;

if (html.includes(targetBtn)) {
    html = html.replace(targetBtn, togglesHTML);
    fs.writeFileSync('index.html', html);
    console.log('✅ Toggles forcefully injected into Settings HTML!');
} else {
    console.log('❌ Could not find the exact Save button string.');
}
