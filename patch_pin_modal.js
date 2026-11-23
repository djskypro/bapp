const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the PIN Modal HTML right before </body>
const pinModal = `
<!-- GLOBAL PIN MODAL -->
<div id="global-pin-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:9999999; justify-content:center; align-items:center; flex-direction:column;">
  <div class="glass" style="width:85%; max-width:320px; background:rgba(20,20,20,0.95); border-radius:20px; padding:25px; text-align:center; display:flex; flex-direction:column; gap:15px;">
    <h3 style="color:var(--primary); margin:0;">🔐 Hidden Chat PIN</h3>
    <p id="pin-modal-desc" style="font-size:12px; color:#aaa; margin:0;">Set a secret code to unlock hidden chats.</p>
    
    <input type="password" id="old-pin-input" maxlength="8" placeholder="Enter current PIN..." style="display:none; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; text-align:center; font-size:18px; outline:none;">
    
    <input type="password" id="new-pin-input" maxlength="8" placeholder="Enter new PIN..." style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; text-align:center; font-size:18px; outline:none;">
    
    <div style="display:flex; gap:10px;">
      <button onclick="closeGlobalPinModal()" style="flex:1; padding:10px; border-radius:12px; border:none; background:rgba(255,255,255,0.1); color:white; cursor:pointer;">Cancel</button>
      <button onclick="saveGlobalPin()" style="flex:1; padding:10px; border-radius:12px; border:none; background:var(--primary); color:black; font-weight:bold; cursor:pointer;">Save</button>
    </div>
  </div>
</div>
`;
html = html.replace('</body>', pinModal + '</body>');

// 2. Add the JS logic
const pinLogic = `
<script>
  function setGlobalPin() {
    const oldPin = localStorage.getItem('bapp_global_pin');
    const modal = document.getElementById('global-pin-modal');
    const oldInput = document.getElementById('old-pin-input');
    const newInput = document.getElementById('new-pin-input');
    const desc = document.getElementById('pin-modal-desc');
    
    modal.style.display = 'flex';
    newInput.value = '';
    
    if (oldPin) {
      oldInput.style.display = 'block';
      oldInput.value = '';
      desc.innerText = "Enter your current PIN to change it.";
    } else {
      oldInput.style.display = 'none';
      desc.innerText = "Set a secret code to unlock hidden chats.";
    }
  }

  function closeGlobalPinModal() {
    document.getElementById('global-pin-modal').style.display = 'none';
  }

  function saveGlobalPin() {
    const oldPin = localStorage.getItem('bapp_global_pin');
    const oldInput = document.getElementById('old-pin-input').value.trim();
    const newInput = document.getElementById('new-pin-input').value.trim();
    
    if (oldPin && oldInput !== oldPin) {
      alert("Incorrect current PIN!");
      return;
    }
    
    if (newInput.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    
    localStorage.setItem('bapp_global_pin', newInput);
    alert("PIN successfully updated to: " + newInput);
    closeGlobalPinModal();
  }
</script>
`;
html = html.replace('</body>', pinLogic + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Custom PIN modal added!");
