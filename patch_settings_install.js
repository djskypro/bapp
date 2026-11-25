const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Stop the auto popup
const oldListener = /window\.addEventListener\('beforeinstallprompt', \(e\) => \{[\s\S]*?\}\);/;
const newListener = `window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Auto popup is disabled. User can install via Settings.
  });`;
html = html.replace(oldListener, newListener);

// 2. Update installPwa to handle cases where it's not supported (like iOS)
const oldInstall = /function installPwa\(\) \{[\s\S]*?\n  \}/;
const newInstall = `function installPwa() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed the app');
        }
        deferredPrompt = null;
        const popup = document.getElementById('pwa-install-popup');
        if (popup) popup.style.display = 'none';
      });
    } else {
      alert("To install BAPP, tap the browser menu (⋮) and select 'Add to Home screen'.");
    }
  }`;
html = html.replace(oldInstall, newInstall);

// 3. Add the Install button to the Settings page
const settingsMarker = `<div class="settings-content">`;
const settingsBtn = `<div class="settings-content">
    
    <!-- INSTALL APP BUTTON -->
    <div class="toggle-row" onclick="installPwa()" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px; cursor:pointer;">
      <div>
        <label style="font-size:16px; font-weight:bold; color:var(--text);">📲 Install App</label>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Add BAPP to your home screen</div>
      </div>
      <div style="color:var(--primary); font-size:20px;">›</div>
    </div>
`;
html = html.replace(settingsMarker, settingsBtn);

fs.writeFileSync('index.html', html);
console.log("✅ Install App button added to Settings!");
