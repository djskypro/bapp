const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the Glass Modals into HTML
const glassModalsHTML = `
<!-- GLASS OPTIONS MODAL (For Notifications / Disappearing) -->
<div id="glass-options-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index:999999; flex-direction:column; justify-content:center; align-items:center;">
    <div class="glass" style="width:85%; max-width:350px; padding:25px; border-radius:20px; display:flex; flex-direction:column;">
        <h3 id="glass-options-title" style="color:white; font-size:20px; margin-bottom:15px; font-weight:bold;">Options</h3>
        <div id="glass-options-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;"></div>
        <button onclick="document.getElementById('glass-options-modal').style.display='none'" style="background:var(--search-bg); color:white; border:none; padding:12px; border-radius:12px; font-weight:bold;">Cancel</button>
    </div>
</div>

<!-- ADVANCED PRIVACY MODAL -->
<div id="privacy-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index:999999; flex-direction:column; justify-content:center; align-items:center;">
    <div class="glass" style="width:90%; max-width:400px; padding:25px; border-radius:20px; display:flex; flex-direction:column;">
        <h3 style="color:var(--primary); font-size:22px; margin-bottom:5px; font-weight:bold;">🛡️ Advanced Privacy</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Protect this specific chat from prying eyes.</p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Blur on App Switch</div>
                <div style="color:var(--text-muted); font-size:11px;">Hides chat when you leave the app</div>
            </div>
            <input type="checkbox" id="privacy-blur" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Anti-Copy Mode</div>
                <div style="color:var(--text-muted); font-size:11px;">Prevents text selection in this chat</div>
            </div>
            <input type="checkbox" id="privacy-anticopy" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Hide Previews</div>
                <div style="color:var(--text-muted); font-size:11px;">Hides messages on the main chat list</div>
            </div>
            <input type="checkbox" id="privacy-previews" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>
        
        <button onclick="saveAdvancedPrivacy()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:12px; font-weight:bold; font-size:16px; margin-bottom:10px;">Save Settings</button>
        <button onclick="document.getElementById('privacy-modal').style.display='none'" style="background:var(--search-bg); color:white; border:none; padding:12px; border-radius:12px; font-weight:bold;">Cancel</button>
    </div>
</div>
`;

html = html.replace('</body>', glassModalsHTML + '\n</body>');

// 2. Rewire the buttons to use the new modals
html = html.replace(`onclick="openNotificationSettings()"`, `onclick="openGlassMenu('Notifications', ['All', 'Mentions', 'Mute'], 'notifications')"`);
html = html.replace(`onclick="openDisappearingMessages()"`, `onclick="openGlassMenu('Disappearing Messages', ['Off', '24 Hours', '7 Days', '90 Days'], 'disappearing')"`);
html = html.replace(`onclick="showEncryptionInfo()"`, `onclick="openGlassMenu('Encryption', ['Messages and calls are end-to-end encrypted. No one outside of this chat, not even BAPP, can read or listen to them.'], 'dummy')"`);
html = html.replace(`onclick="showAdvancedPrivacy()"`, `onclick="openPrivacyModal()"`);

// 3. Inject the JavaScript for the modals
const modalLogic = `
  // --- GLASS MENU LOGIC ---
  function openGlassMenu(title, options, settingKey) {
      document.getElementById('glass-options-title').innerText = title;
      const list = document.getElementById('glass-options-list');
      list.innerHTML = '';
      
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let currentSetting = settings[activeChatId] ? settings[activeChatId][settingKey] : null;
      
      options.forEach(opt => {
          let isSelected = (currentSetting === opt) || (opt.includes('encrypted') && settingKey === 'dummy');
          
          if (settingKey === 'dummy') {
              // Just display text for encryption
              list.innerHTML += '<div style="color:var(--text-muted); font-size:14px; line-height:1.5;">' + opt + '</div>';
          } else {
              list.innerHTML += \`
                  <div onclick="selectGlassOption('\${settingKey}', '\${opt}')" style="background:\${isSelected ? 'var(--primary)' : 'var(--search-bg)'}; color:\${isSelected ? 'black' : 'white'}; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between;">
                      <span>\${opt}</span>
                      \${isSelected ? '<span>✓</span>' : ''}
                  </div>
              \`;
          }
      });
      
      document.getElementById('glass-options-modal').style.display = 'flex';
  }

  function selectGlassOption(key, value) {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId][key] = value;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      
      document.getElementById('glass-options-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Updated to " + value);
      openGroupInfo(activeChatId); // Refresh UI
  }

  // --- ADVANCED PRIVACY LOGIC ---
  function openPrivacyModal() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let p = settings[activeChatId] || {};
      
      document.getElementById('privacy-blur').checked = p.blurOnSwitch || false;
      document.getElementById('privacy-anticopy').checked = p.antiCopy || false;
      document.getElementById('privacy-previews').checked = p.hidePreviews || false;
      
      document.getElementById('privacy-modal').style.display = 'flex';
  }

  function saveAdvancedPrivacy() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      
      settings[activeChatId].blurOnSwitch = document.getElementById('privacy-blur').checked;
      settings[activeChatId].antiCopy = document.getElementById('privacy-anticopy').checked;
      settings[activeChatId].hidePreviews = document.getElementById('privacy-previews').checked;
      
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('privacy-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Privacy Settings Saved! 🛡️");
  }

  // --- IMPLEMENT BLUR ON APP SWITCH ---
  window.addEventListener('blur', function() {
      if (!activeChatId) return;
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if (settings[activeChatId] && settings[activeChatId].blurOnSwitch) {
          const msgBox = document.getElementById('chat-messages');
          if(msgBox) msgBox.style.filter = 'blur(15px)';
      }
  });
  window.addEventListener('focus', function() {
      const msgBox = document.getElementById('chat-messages');
      if(msgBox) msgBox.style.filter = 'none';
  });

  // --- IMPLEMENT ANTI-COPY ---
  // We check this dynamically in openChat
  const oldOpenChat = window.openChat;
  window.openChat = function(id, profileObj) {
      originalOpenChat(id, profileObj);
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      const msgBox = document.getElementById('chat-messages');
      if (settings[id] && settings[id].antiCopy) {
          msgBox.style.userSelect = 'none';
          msgBox.style.webkitUserSelect = 'none';
      } else {
          msgBox.style.userSelect = 'text';
          msgBox.style.webkitUserSelect = 'text';
      }
  };
`;

// Inject logic
const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + modalLogic + html.substring(lastScriptIdx);
}

fs.writeFileSync('index.html', html);
console.log('✅ Beautiful Glass Menus & Advanced Privacy features injected!');
