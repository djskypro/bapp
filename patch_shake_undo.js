const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the Toggles into the Settings Page
const oldSettings = `      <div style="font-size:14px;">Auto-Switch Location</div>
      <input type="checkbox" id="settings-auto-location" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>
    
    <button class="save-btn" onclick="saveProfile()">Save Profile</button>`;

const newSettings = `      <div style="font-size:14px;">Auto-Switch Location</div>
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
html = html.replace(oldSettings, newSettings);

// 2. Load and Save the Toggles in Settings
const oldOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;`;
const newOpenSettings = `document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;
    document.getElementById('settings-panic-mode').checked = window.enablePanicMode !== false;
    document.getElementById('settings-shake-undo').checked = window.enableShakeToUndo === true;`;
html = html.replace(oldOpenSettings, newOpenSettings);

const oldSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;`;
const newSaveProfile = `myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    window.enablePanicMode = document.getElementById('settings-panic-mode').checked;
    window.enableShakeToUndo = document.getElementById('settings-shake-undo').checked;
    localStorage.setItem('bapp_panic_mode', window.enablePanicMode);
    localStorage.setItem('bapp_shake_undo', window.enableShakeToUndo);`;
html = html.replace(oldSaveProfile, newSaveProfile);

// 3. Initialize Toggles on Load
const initToggles = `
  window.enablePanicMode = localStorage.getItem('bapp_panic_mode') !== 'false';
  window.enableShakeToUndo = localStorage.getItem('bapp_shake_undo') === 'true';
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", initToggles + "\n  let myBappId = localStorage.getItem('bapp_username');");

// 4. Track the Last Sent Message
const oldSendTrack = `      if (isConnected) {
        socket.send(JSON.stringify(payload));
      } else {`;
const newSendTrack = `      // TRACK FOR SHAKE TO UNDO
      window.lastSentMessage = { to: to, msgId: msgId };

      if (isConnected) {
        socket.send(JSON.stringify(payload));
      } else {`;
html = html.replace(oldSendTrack, newSendTrack);

// 5. Rewrite the Shake Listener (Line 5680)
const startShake = html.indexOf("window.addEventListener('devicemotion', function(event) {");
const endShake = html.indexOf("});", startShake) + 3;

const newShakeLogic = `
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    if (force > 35 && (now - lastShake) > 2000) {
      lastShake = now;
      
      // Check Panic Mode
      if (window.enablePanicMode) {
          document.getElementById('fake-calculator').style.display = 'flex';
      } 
      // Check Shake to Undo
      else if (window.enableShakeToUndo) {
          if (window.lastSentMessage && window.lastSentMessage.msgId) {
              const msgToDelete = window.lastSentMessage;
              
              // 1. Remove from DOM
              const el = document.getElementById('msg-' + msgToDelete.msgId);
              if(el) {
                  el.style.transition = 'opacity 0.3s, transform 0.3s';
                  el.style.opacity = '0';
                  el.style.transform = 'scale(0.5)';
                  setTimeout(() => el.remove(), 300);
              }
              
              // 2. Remove from LocalStorage
              let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msgToDelete.to)) || [];
              msgs = msgs.filter(m => m.msgId !== msgToDelete.msgId);
              localStorage.setItem('bapp_msgs_' + msgToDelete.to, JSON.stringify(msgs));
              loadChatList();

              // 3. Send Ghost Delete to Server
              if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type: 'ghost_delete', to: msgToDelete.to, from: myBappId, msgId: msgToDelete.msgId }));
              }
              
              // 4. Clear the tracker
              window.lastSentMessage = null;
              
              // 5. Feedback
              if (typeof showToast === 'function') showToast("Message Undone! 🫢");
              else alert("Message Undone!");
          }
      }
    }
  });
`;
html = html.substring(0, startShake) + newShakeLogic + html.substring(endShake);

fs.writeFileSync('index.html', html);
console.log('✅ Settings toggles added, and Shake to Undo is active!');
