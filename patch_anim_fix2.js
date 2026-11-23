const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the animation toggle to the HTML (right after auto-location toggle-row)
const oldToggle = `      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

const newToggle = oldToggle + `

    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px; display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">✨</span> Cinematic Animations
      </div>
      <input type="checkbox" id="settings-animations" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>`;

if (html.includes(oldToggle) && !html.includes('settings-animations')) {
    html = html.replace(oldToggle, newToggle);
}

// 2. Add CSS to kill animations if disabled + add zoom-in animation
const animCSS = `
<style>
  /* Kill all animations when disabled */
  body.no-animations * {
    animation: none !important;
    transition: none !important;
  }

  /* Zoom-in animation for new messages */
  @keyframes zoomInMsg {
    0% { transform: scale(0.85); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  .msg.zoom-in {
    animation: zoomInMsg 0.35s ease-out;
  }
</style>
</head>`;

if (!html.includes('body.no-animations')) {
    html = html.replace('</head>', animCSS);
}

// 3. Load toggle state on open
const oldOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;`;
const newOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;
    document.getElementById('settings-animations').checked = window.enableAnimations !== false;`;
html = html.replace(oldOpenSettings, newOpenSettings);

// 4. Save toggle state on save
const oldSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;`;
const newSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    window.enableAnimations = document.getElementById('settings-animations').checked;
    localStorage.setItem('bapp_animations', window.enableAnimations);
    if (window.enableAnimations) document.body.classList.remove('no-animations');
    else document.body.classList.add('no-animations');`;
html = html.replace(oldSaveProfile, newSaveProfile);

// 5. Initialize on load
const initLogic = `
  window.enableAnimations = localStorage.getItem('bapp_animations') !== 'false';
  if (!window.enableAnimations) document.body.classList.add('no-animations');
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", initLogic + "\n  let myBappId = localStorage.getItem('bapp_username');");

// 6. Apply zoom-in animation when a new message is added
// Find appendMessage and add the zoom-in class to newMsg
const oldAppend = `    newMsg.className = 'msg ' + type;
    if (bubbleColor && type === 'sent') {`;
const newAppend = `    newMsg.className = 'msg ' + type;
    if (window.enableAnimations !== false) newMsg.classList.add('zoom-in');
    if (bubbleColor && type === 'sent') {`;

if (html.includes(oldAppend)) {
    html = html.replace(oldAppend, newAppend);
}

fs.writeFileSync('index.html', html);
console.log('✅ Toggle + Zoom-in animation added!');
