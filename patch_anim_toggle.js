const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Toggle to the Settings HTML
const oldToggle = `<div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

const newToggle = oldToggle + `

    <div class="toggle-row">
      <div style="font-size:14px; display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">✨</span> Cinematic Animations
      </div>
      <input type="checkbox" id="settings-animations" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

if (html.includes(oldToggle)) {
    html = html.replace(oldToggle, newToggle);
}

// 2. Add the CSS to kill all animations
const killCSS = `
<style>
  body.no-animations * {
    animation: none !important;
    transition: none !important;
  }
</style>
</head>`;
if (!html.includes('body.no-animations')) {
    html = html.replace('</head>', killCSS);
}

// 3. Add the Logic to openSettings
const oldOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;`;
const newOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;
    document.getElementById('settings-animations').checked = window.enableAnimations !== false;`;
html = html.replace(oldOpenSettings, newOpenSettings);

// 4. Add the Logic to saveProfile
const oldSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;`;
const newSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    window.enableAnimations = document.getElementById('settings-animations').checked;
    localStorage.setItem('bapp_animations', window.enableAnimations);
    if (window.enableAnimations) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }`;
html = html.replace(oldSaveProfile, newSaveProfile);

// 5. Initialize on Load
const initLogic = `
  window.enableAnimations = localStorage.getItem('bapp_animations') !== 'false';
  if (!window.enableAnimations) document.body.classList.add('no-animations');
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", initLogic + "\n  let myBappId = localStorage.getItem('bapp_username');");

fs.writeFileSync('index.html', html);
console.log('✅ Sick Animation Toggle added!');
