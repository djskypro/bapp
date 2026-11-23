const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_6.html');

let html = fs.readFileSync('index.html', 'utf8');

// 2. Add Call Icons to the Chat Header & Make Name Clickable
const oldHeader = `<div class="chat-header">
    <div class="back-btn" onclick="goBack()">←</div>
    <img src="" id="chat-avatar" class="avatar">
    <div>
      <div class="name" id="chat-name"></div>
      <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
    </div>
  </div>`;

const newHeader = `<div class="chat-header">
    <div class="back-btn" onclick="goBack()">←</div>
    <div style="display:flex; align-items:center; flex:1; cursor:pointer;" onclick="openContactInfo()">
      <img src="" id="chat-avatar" class="avatar">
      <div>
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
    </div>
    <div style="display:flex; gap:15px; font-size:22px; color:var(--primary); margin-right:10px;">
      <span onclick="startCall('video')">📹</span>
      <span onclick="startCall('audio')">📞</span>
    </div>
  </div>`;

html = html.replace(oldHeader, newHeader);

// 3. Add the Contact Info View right before </body>
const contactInfoHTML = `
<!-- CONTACT INFO VIEW -->
<div id="contact-info-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div class="back-btn" onclick="closeContactInfo()">←</div>
      <h1>Contact Info</h1>
    </div>
  </div>
  
  <div class="settings-content" style="align-items:center; display:flex; flex-direction:column;">
    <img id="info-avatar" src="" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 15px;">
    <h2 id="info-name" style="font-size:24px; margin-bottom:5px;">Name</h2>
    <div id="info-username" style="color:var(--text-muted); font-size:16px; margin-bottom:20px;">@username</div>
    
    <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Bio</div>
      <div id="info-bio" style="font-size:16px;">No bio yet</div>
    </div>

    <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Phone</div>
      <div id="info-phone" style="font-size:16px; color:var(--primary);">Not shared</div>
    </div>

    <div style="width:100%; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:5px;">Location</div>
      <div id="info-location" style="font-size:16px;">Unknown</div>
    </div>
  </div>
</div>
`;
html = html.replace('</body>', contactInfoHTML + '\n</body>');

// 4. Add the JavaScript logic
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

const newFunctions = `
  // --- CALL & CONTACT INFO LOGIC ---
  function startCall(type) {
    const name = document.getElementById('chat-name').textContent;
    if(type === 'video') alert("📹 Starting Video Call with " + name + "... (Feature coming soon!)");
    else alert("📞 Starting Audio Call with " + name + "... (Feature coming soon!)");
  }

  function openContactInfo() {
    const id = document.getElementById('chat-name').textContent; // Internal ID is stored here
    const currentUsername = activeChatId;
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profiles[currentUsername] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + currentUsername.substring(0,2), bio: 'Hey there! I am using BAPP.', phone: 'Not shared', location: 'Unknown' };
    
    document.getElementById('info-name').textContent = p.name || currentUsername;
    document.getElementById('info-username').textContent = '@' + currentUsername;
    document.getElementById('info-avatar').src = p.avatar;
    document.getElementById('info-bio').textContent = p.bio || 'Hey there! I am using BAPP.';
    document.getElementById('info-phone').textContent = p.phone || 'Not shared';
    document.getElementById('info-location').textContent = p.location || 'Unknown';
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('contact-info-view').classList.add('active');
  }

  function closeContactInfo() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
  }
`;

js = js.replace("function openSettings()", newFunctions + "\n  function openSettings()");

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Call icons and Contact Info page added!');
