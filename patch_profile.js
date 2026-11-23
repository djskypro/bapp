const fs = require('fs');

// ==========================================
// 0. BACKUP EVERYTHING FIRST
// ==========================================
fs.copyFileSync('server.js', 'server_backup.js');
fs.copyFileSync('index.html', 'index_backup.html');
console.log('✅ Backups created (server_backup.js, index_backup.html)');

// ==========================================
// 1. UPDATE SERVER (Store and send Profile Data)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Update register to accept profile data
const oldRegister = `if (data.type === 'register_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            users[data.username] = true; // Save to database
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            
            bappUsers.set(data.username, ws);
            console.log(\`🟢 BAPP User Online: \${data.username}\`);
            ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
        }`;

const newRegister = `if (data.type === 'register_user') {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            // Save the whole profile object, not just 'true'
            users[data.username] = data.profile || { name: data.username };
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            
            bappUsers.set(data.username, ws);
            console.log(\`🟢 BAPP User Online: \${data.username}\`);
            ws.send(JSON.stringify({ type: 'register_success', username: data.username }));
        }`;

serverJs = serverJs.replace(oldRegister, newRegister);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. UPDATE UI (Build the new Settings Page)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Replace the entire Settings View HTML
const startSettings = html.indexOf('<!-- SETTINGS VIEW -->');
const endSettings = html.indexOf('</body>');
const newSettingsHTML = `
<!-- SETTINGS VIEW -->
<div id="settings-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div class="back-btn" onclick="goBack()">←</div>
      <h1>Profile Settings</h1>
    </div>
  </div>
  
  <div style="padding: 20px; flex: 1; overflow-y: auto;">
    <!-- Avatar -->
    <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
      <img id="settings-avatar" src="" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 15px;">
      <label style="background:var(--search-bg); padding:10px 20px; border-radius:12px; cursor:pointer; font-size:14px;">
        Change Profile Picture
        <input type="file" id="settings-pic-input" accept="image/*" style="display:none;">
      </label>
    </div>

    <!-- Username (Read Only) -->
    <label style="font-size:12px; color:var(--text-muted); margin-left:10px;">Username</label>
    <input type="text" id="settings-username" disabled style="width:100%; padding:15px; border-radius:12px; border:none; margin-bottom:15px; background:rgba(255,255,255,0.05); color:var(--text-muted); outline:none; font-size:16px;">

    <!-- Name -->
    <label style="font-size:12px; color:var(--text-muted); margin-left:10px;">Display Name</label>
    <input type="text" id="settings-name-input" placeholder="Your Name" style="width:100%; padding:15px; border-radius:12px; border:none; margin-bottom:15px; background:var(--search-bg); color:var(--text); outline:none; font-size:16px;">

    <!-- Bio -->
    <label style="font-size:12px; color:var(--text-muted); margin-left:10px;">Bio / Description</label>
    <textarea id="settings-bio" placeholder="Tell people about yourself..." rows="3" style="width:100%; padding:15px; border-radius:12px; border:none; margin-bottom:15px; background:var(--search-bg); color:var(--text); outline:none; font-size:16px; resize:none;"></textarea>

    <!-- Phone -->
    <label style="font-size:12px; color:var(--text-muted); margin-left:10px;">Phone Number</label>
    <input type="tel" id="settings-phone" placeholder="+256 700 000000" style="width:100%; padding:15px; border-radius:12px; border:none; margin-bottom:15px; background:var(--search-bg); color:var(--text); outline:none; font-size:16px;">

    <!-- Location -->
    <label style="font-size:12px; color:var(--text-muted); margin-left:10px;">Location</label>
    <div style="display:flex; gap:10px; margin-bottom:10px;">
      <input type="text" id="settings-location" placeholder="City, Country" style="flex:1; padding:15px; border-radius:12px; border:none; background:var(--search-bg); color:var(--text); outline:none; font-size:16px;">
      <button onclick="randomizeLocation()" style="background:var(--search-bg); color:var(--text); border:none; border-radius:12px; padding:0 15px; font-size:18px;">🎲</button>
    </div>
    
    <div style="display:flex; align-items:center; justify-content:space-between; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:25px;">
      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>

    <button onclick="saveProfile()" style="background:var(--primary); color:black; padding:15px; border:none; border-radius:12px; font-weight:bold; width:100%; font-size:16px;">Save Profile</button>
  </div>
</div>
`;
html = html.substring(0, startSettings) + newSettingsHTML + html.substring(endSettings);


// B. Update the JavaScript Logic
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// Update myProfile default
js = js.replace(
  "let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: 'User', avatar: 'https://ui-avatars.com/api/?name=U&background=random' };",
  "let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: myBappId, bio: '', phone: '', location: 'Unknown', autoLocation: false, avatar: 'https://ui-avatars.com/api/?name=' + myBappId.charAt(0) + '&background=random' };\n  let autoLocationInterval = null;"
);

// Update register to send profile
js = js.replace(
  "socket.send(JSON.stringify({ type: 'register_user', username: myBappId }));",
  "socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));"
);

// Update openSettings
const oldOpenSettings = js.substring(js.indexOf('function openSettings()'), js.indexOf('function saveProfile()'));
const newOpenSettings = `
  function openSettings() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('settings-view').classList.add('active');
    
    // Load data into inputs
    document.getElementById('settings-username').value = myBappId;
    document.getElementById('settings-name-input').value = myProfile.name;
    document.getElementById('settings-bio').value = myProfile.bio || '';
    document.getElementById('settings-phone').value = myProfile.phone || '';
    document.getElementById('settings-location').value = myProfile.location || 'Unknown';
    document.getElementById('settings-avatar').src = myProfile.avatar;
    document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;
    
    if (myProfile.autoLocation) startAutoLocation();
    else stopAutoLocation();
  }

  const cities = ['Kampala, UG', 'Nairobi, KE', 'London, UK', 'New York, USA', 'Tokyo, JP', 'Dubai, UAE', 'Cape Town, ZA', 'Paris, FR'];
  function randomizeLocation() {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    document.getElementById('settings-location').value = randomCity;
  }

  function startAutoLocation() {
    stopAutoLocation();
    autoLocationInterval = setInterval(() => {
      randomizeLocation();
    }, 3000); // Change every 3 seconds
  }

  function stopAutoLocation() {
    if (autoLocationInterval) clearInterval(autoLocationInterval);
  }

  document.getElementById('settings-auto-location').addEventListener('change', function(e) {
    if (e.target.checked) startAutoLocation();
    else stopAutoLocation();
  });
`;
js = js.replace(oldOpenSettings, newOpenSettings);

// Update saveProfile
const oldSave = js.substring(js.indexOf('function saveProfile()'), js.indexOf("document.getElementById('settings-pic-input')"));
const newSave = `
  function saveProfile() {
    myProfile.name = document.getElementById('settings-name-input').value || myBappId;
    myProfile.bio = document.getElementById('settings-bio').value;
    myProfile.phone = document.getElementById('settings-phone').value;
    myProfile.location = document.getElementById('settings-location').value;
    myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    
    localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    
    // Update server with new profile
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    
    alert("Profile Saved!");
    goBack();
  }
`;
js = js.replace(oldSave, newSave);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Profile Settings, Bio, Phone, and Auto-Location added!');
