const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. REPLACE THE OLD COLOR PICKER IN SETTINGS
// ==========================================
const oldSettingsColor = `    <div class="input-group" style="margin-top: 15px;">
      <label>Chat Bubble Color</label>
      <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
        <input type="color" id="settings-bubble-color" style="width: 50px; height: 50px; padding: 0; border: none; border-radius: 50%; cursor: pointer; background: transparent;">
        <span style="color: var(--text-muted); font-size: 14px;">Pick your custom theme color</span>
      </div>
    </div>`;

const newSettingsColor = `    <div class="input-group" style="margin-top: 15px; cursor: pointer;" onclick="openThemeModal()">
      <label style="cursor: pointer;">Chat Bubble Color</label>
      <div style="display:flex; align-items:center; gap:10px; margin-top:5px; background: var(--search-bg); padding: 15px; border-radius: 12px; justify-content: space-between;">
        <span style="color: var(--text); font-size: 16px; font-weight: 500;">Customize Theme</span>
        <div id="settings-color-indicator" style="width: 30px; height: 30px; border-radius: 50%; background: #005c4b; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
      </div>
    </div>`;

html = html.replace(oldSettingsColor, newSettingsColor);

// ==========================================
// 2. ADD THE THEME MODAL HTML
// ==========================================
const themeModalHTML = `
<div id="theme-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index:99999; flex-direction:column; justify-content:center; align-items:center;">
  <div class="glass" style="width: 90%; max-width: 400px; padding: 25px; border-radius: 25px; display:flex; flex-direction:column; align-items:center;">
    <h2 style="margin-bottom: 20px; font-size: 22px;">Choose Your Theme</h2>
    
    <!-- Live Preview -->
    <div style="width: 100%; background: var(--bg); padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid var(--glass-border);">
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Live Preview</div>
      <div id="theme-preview-bubble" style="background: #005c4b; color: white; padding: 10px 15px; border-radius: 15px 15px 0 15px; align-self: flex-end; margin-left: auto; max-width: 80%; font-size: 15px; transition: background 0.3s;">
        This is how your message will look! ✨
      </div>
    </div>

    <!-- Preset Colors -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 25px; width: 100%;">
      <div class="color-swatch" onclick="setThemeColor('#005c4b')" style="background: #005c4b; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#202c33')" style="background: #202c33; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#e74c3c')" style="background: #e74c3c; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#3498db')" style="background: #3498db; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#9b59b6')" style="background: #9b59b6; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      
      <div class="color-swatch" onclick="setThemeColor('#f1c40f')" style="background: #f1c40f; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#e67e22')" style="background: #e67e22; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#1abc9c')" style="background: #1abc9c; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#34495e')" style="background: #34495e; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
      <div class="color-swatch" onclick="setThemeColor('#ff007f')" style="background: #ff007f; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; margin: 0 auto;"></div>
    </div>

    <!-- Custom Hex Input -->
    <div style="display:flex; align-items:center; gap:10px; width:100%; margin-bottom: 25px;">
      <span style="color:var(--text-muted); font-size:14px;">Custom:</span>
      <input type="color" id="custom-theme-color" oninput="setThemeColor(this.value)" style="flex:1; height: 40px; border: none; background: transparent; cursor: pointer;">
    </div>

    <!-- Buttons -->
    <div style="display:flex; gap:15px; width:100%;">
      <button onclick="resetThemeColor()" style="flex:1; padding:15px; border-radius:15px; border:none; background:var(--search-bg); color:var(--text); font-weight:bold; cursor:pointer;">Default</button>
      <button onclick="closeThemeModal()" style="flex:1; padding:15px; border-radius:15px; border:none; background:var(--primary); color:black; font-weight:bold; cursor:pointer;">Done</button>
    </div>
  </div>
</div>
</body>`;
html = html.replace('</body>', themeModalHTML);

// ==========================================
// 3. UPDATE JAVASCRIPT LOGIC
// ==========================================
// A. Initialize the global variable
if(!html.includes("window.selectedBubbleColor")) {
    html = html.replace("let myProfile = JSON.parse", "window.selectedBubbleColor = '#005c4b';\n  let myProfile = JSON.parse");
}

// B. Fix openSettings to read from the variable and set the UI indicator
const oldOpenSettings = `    document.getElementById('settings-avatar').src = myProfile.avatar;
    document.getElementById('settings-bubble-color').value = myProfile.bubbleColor || '#005c4b';`;
    
const newOpenSettings = `    document.getElementById('settings-avatar').src = myProfile.avatar;
    window.selectedBubbleColor = myProfile.bubbleColor || '#005c4b';
    document.getElementById('settings-color-indicator').style.background = window.selectedBubbleColor;`;
html = html.replace(oldOpenSettings, newOpenSettings);

// C. Fix saveProfile to read from the variable
const oldSaveProfile = `    myProfile.bubbleColor = document.getElementById('settings-bubble-color').value;`;
const newSaveProfile = `    myProfile.bubbleColor = window.selectedBubbleColor;`;
html = html.replace(oldSaveProfile, newSaveProfile);

// D. Add the Modal functions
const themeLogic = `
  function openThemeModal() {
    document.getElementById('theme-modal').style.display = 'flex';
    document.getElementById('custom-theme-color').value = window.selectedBubbleColor;
    setThemeColor(window.selectedBubbleColor); // Trigger preview update
  }
  
  function closeThemeModal() {
    document.getElementById('theme-modal').style.display = 'none';
  }

  function setThemeColor(color) {
    window.selectedBubbleColor = color;
    document.getElementById('theme-preview-bubble').style.background = color;
    document.getElementById('custom-theme-color').value = color;
    
    // Highlight the selected swatch
    document.querySelectorAll('.color-swatch').forEach(s => {
        if (s.style.background.includes(color) || s.style.backgroundColor.includes(color)) {
            s.style.border = '3px solid white';
            s.style.transform = 'scale(1.1)';
        } else {
            s.style.border = '2px solid transparent';
            s.style.transform = 'scale(1)';
        }
    });
  }

  function resetThemeColor() {
    setThemeColor('#005c4b'); // Default WhatsApp green
  }
`;
html = html.replace("function openSettings()", themeLogic + "\n  function openSettings()");

fs.writeFileSync('index.html', html);
console.log('✅ GBWhatsApp Theme Engine successfully injected!');
