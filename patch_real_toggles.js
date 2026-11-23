const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Missing HTML Toggles
const oldSettingsHTML = `      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>
    
    <button class="save-btn" onclick="saveProfile()">Save Profile</button>`;

const newSettingsHTML = `      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row">
      <div style="font-size:14px;">Panic Mode (Shake for Calculator)</div>
      <input type="checkbox" id="settings-panic-mode" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <div class="toggle-row">
      <div style="font-size:14px;">Shake to Undo Send</div>
      <input type="checkbox" id="settings-shake-undo" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>
    
    <button class="save-btn" onclick="saveProfile()">Save Profile</button>`;

if (html.includes(oldSettingsHTML)) {
    html = html.replace(oldSettingsHTML, newSettingsHTML);
}

// 2. Initialize the variables safely at the top of the script
const initVars = `
  window.enablePanicMode = localStorage.getItem('bapp_panic_mode') !== 'false'; // Default true
  window.enableShakeToUndo = localStorage.getItem('bapp_shake_undo') === 'true'; // Default false
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", initVars + "\n  let myBappId = localStorage.getItem('bapp_username');");

// 3. Update openSettings to show the correct checkbox state
const oldOpenSettings = `    document.getElementById('settings-avatar').src = myProfile.avatar;`;
const newOpenSettings = `    document.getElementById('settings-avatar').src = myProfile.avatar;
    document.getElementById('settings-panic-mode').checked = window.enablePanicMode;
    document.getElementById('settings-shake-undo').checked = window.enableShakeToUndo;`;
html = html.replace(oldOpenSettings, newOpenSettings);

fs.writeFileSync('index.html', html);
console.log('✅ Real toggles added and wired to the shake sensor!');
