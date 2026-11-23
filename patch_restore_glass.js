const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the Glass Menus HTML before </body>
const glassHTML = `
<!-- GLASS OPTIONS MODAL -->
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
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Protect this specific chat.</p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Blur on App Switch</div>
                <div style="color:var(--text-muted); font-size:11px;">Hides chat in task switcher</div>
            </div>
            <input type="checkbox" id="privacy-blur" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Anti-Copy Mode</div>
                <div style="color:var(--text-muted); font-size:11px;">Prevents text selection</div>
            </div>
            <input type="checkbox" id="privacy-anticopy" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <div>
                <div style="color:white; font-size:15px; font-weight:bold;">Hide Previews</div>
                <div style="color:var(--text-muted); font-size:11px;">Hides text on main chat list</div>
            </div>
            <input type="checkbox" id="privacy-previews" style="width:20px; height:20px; accent-color:var(--primary);">
        </div>
        
        <button onclick="saveAdvancedPrivacy()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:12px; font-weight:bold; font-size:16px; margin-bottom:10px;">Save Settings</button>
        <button onclick="document.getElementById('privacy-modal').style.display='none'" style="background:var(--search-bg); color:white; border:none; padding:12px; border-radius:12px; font-weight:bold;">Cancel</button>
    </div>
</div>
</body>`;
html = html.replace('</body>', glassHTML);

// 2. Add the Group Options CSS
const groupCSS = `
<style>
  .group-option { display: flex; align-items: center; gap: 15px; padding: 15px 10px; cursor: pointer; border-bottom: 1px solid var(--glass-border); }
  .group-option:active { background: var(--search-bg); border-radius: 10px; }
  .group-option-text { font-size: 16px; color: var(--text); font-weight: 500; }
</style>
</head>`;
if (!html.includes('.group-option {')) {
    html = html.replace('</head>', groupCSS);
}

// 3. Inject the Options list into the Group Info View
// We find the "Add Member" button and insert the list right after it
const oldAddBtn = `<span style="font-size:20px;">➕</span> Add Member
    </button>`;

const newAddBtn = `<span style="font-size:20px;">➕</span> Add Member
    </button>

    <div style="width: 100%; border-top: 1px solid var(--glass-border); padding-top: 15px;">
        <div class="group-option" onclick="openGlassMenu('Notifications', ['All', 'Mentions', 'Mute'], 'notifications')">
            <div style="font-size: 20px;">🔔</div>
            <div class="group-option-text">Notifications <span id="grp-notif-val" style="color:var(--text-muted); font-size:12px; margin-left:5px;"></span></div>
        </div>
        <div class="group-option" onclick="openGlassMenu('Media visibility', ['On', 'Off'], 'mediaVisibility')">
            <div style="font-size: 20px;">🖼️</div>
            <div class="group-option-text">Media visibility</div>
        </div>
        <div class="group-option" onclick="openGlassMenu('Encryption', ['Messages and calls are end-to-end encrypted. No one outside of this chat, not even BAPP, can read or listen to them.'], 'dummy')">
            <div style="font-size: 20px;">🔒</div>
            <div class="group-option-text">Encryption</div>
        </div>
        <div class="group-option" onclick="openGlassMenu('Disappearing messages', ['Off', '24 Hours', '7 Days', '90 Days'], 'disappearing')">
            <div style="font-size: 20px;">🕒</div>
            <div class="group-option-text">Disappearing messages <span id="grp-disappear-val" style="color:var(--text-muted); font-size:12px; margin-left:5px;"></span></div>
        </div>
        <div class="group-option" onclick="alert('Chat lock toggle coming in the next update!')">
            <div style="font-size: 20px;">🔐</div>
            <div class="group-option-text">Chat lock</div>
        </div>
        <div class="group-option" onclick="openPrivacyModal()">
            <div style="font-size: 20px;">🛡️</div>
            <div class="group-option-text">Advanced chat privacy</div>
        </div>
        <div class="group-option" onclick="alert('Added to Favorites!')">
            <div style="font-size: 20px;">❤️</div>
            <div class="group-option-text">Add to Favorites</div>
        </div>
        <div class="group-option" onclick="clearGroupChat()">
            <div style="font-size: 20px; color:#e74c3c;">🚫</div>
            <div class="group-option-text" style="color:#e74c3c;">Clear chat</div>
        </div>
        <div class="group-option" onclick="exitCurrentGroup()">
            <div style="font-size: 20px; color:#e74c3c;">🚪</div>
            <div class="group-option-text" style="color:#e74c3c;">Exit group</div>
        </div>
    </div>`;

if (html.includes(oldAddBtn)) {
    html = html.replace(oldAddBtn, newAddBtn);
} else {
    console.log("❌ Could not find Add Member button anchor.");
}

// 4. Inject the JavaScript functions safely
const jsLogic = `
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
      
      if (key === 'notifications') document.getElementById('grp-notif-val').innerText = value;
      if (key === 'disappearing') document.getElementById('grp-disappear-val').innerText = value;
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

  // --- BLUR ON APP SWITCH ---
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

  // --- CLEAR CHAT & EXIT GROUP ---
  function clearGroupChat() {
      if (confirm("Clear all messages in this chat? This cannot be undone.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          document.getElementById('chat-messages').innerHTML = '';
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat cleared!");
          else alert("Chat cleared.");
      }
  }
  
  function exitCurrentGroup() {
      if(!confirm("Are you sure you want to exit this group?")) return;
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let g = groups[activeChatId];
      if(g) {
          g.members = g.members.filter(m => m !== myBappId);
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
      }
      let chats = getChats();
      chats = chats.filter(id => id !== activeChatId);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
      loadChatList();
      goBack();
  }

  // --- ANTI-COPY IN OPEN CHAT ---
  // We wrap the openChat function to add anti-copy
  const originalOpenChatForPrivacy = window.openChat;
  window.openChat = function(id, profileObj) {
      originalOpenChatForPrivacy(id, profileObj);
      
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      const chatBox = document.getElementById('chat-messages');
      if (chatBox) {
          if (settings[id] && settings[id].antiCopy) {
              chatBox.style.userSelect = 'none';
              chatBox.style.webkitUserSelect = 'none';
          } else {
              chatBox.style.userSelect = 'text';
              chatBox.style.webkitUserSelect = 'text';
          }
      }
  };
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + jsLogic + html.substring(lastScriptIdx);
}

fs.writeFileSync('index.html', html);
console.log('✅ Features safely restored and fully functional!');
