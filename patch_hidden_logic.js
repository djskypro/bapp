const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the PIN popup UI
const pinUI = `
<!-- HIDDEN CHAT PIN MODAL -->
<div id="pin-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:9999999; justify-content:center; align-items:center; flex-direction:column;">
  <div class="glass" style="width:80%; max-width:300px; background:rgba(20,20,20,0.95); border-radius:20px; padding:25px; text-align:center; display:flex; flex-direction:column; gap:15px;">
    <h3 style="color:var(--primary); margin:0;">Set Secret PIN</h3>
    <p style="font-size:12px; color:#aaa; margin:0;">This PIN will hide the chat. Type it in the search bar to unhide it.</p>
    <input type="password" id="hide-pin-input" maxlength="8" placeholder="Enter PIN..." style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; text-align:center; font-size:18px; outline:none;">
    <div style="display:flex; gap:10px;">
      <button onclick="closePinModal()" style="flex:1; padding:10px; border-radius:12px; border:none; background:rgba(255,255,255,0.1); color:white; cursor:pointer;">Cancel</button>
      <button onclick="confirmHideChat()" style="flex:1; padding:10px; border-radius:12px; border:none; background:var(--primary); color:black; font-weight:bold; cursor:pointer;">Hide</button>
    </div>
  </div>
</div>
`;
html = html.replace('</body>', pinUI + '</body>');

// 2. Add the logic
const pinLogic = `
<script>
  function promptHideChat() {
    document.getElementById('pin-modal').style.display = 'flex';
    document.getElementById('hide-pin-input').value = '';
    document.getElementById('hide-pin-input').focus();
    closeChatListMenu();
  }

  function closePinModal() {
    document.getElementById('pin-modal').style.display = 'none';
  }

  function confirmHideChat() {
    const pin = document.getElementById('hide-pin-input').value.trim();
    if (pin.length < 4) {
      alert("PIN must be at least 4 digits!");
      return;
    }
    
    // Save the hidden chat ID and its PIN
    let hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    hiddenChats[currentSelectedChatId] = pin;
    localStorage.setItem('bapp_hidden_chats', JSON.stringify(hiddenChats));
    
    // Also save the chat to the hidden list so we can restore it
    let allChats = JSON.parse(localStorage.getItem('bapp_chats')) || [];
    
    closePinModal();
    loadChatList(); // This will refresh the list, and we will hide it in the loadChatList function
  }
</script>
`;
html = html.replace('</body>', pinLogic + '</body>');

// 3. Update loadChatList to filter out hidden chats
const oldFilter = `chats.forEach(id => {`;
const newFilter = `const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    const visibleChats = chats.filter(id => !hiddenChats[id]);
    
    visibleChats.forEach(id => {`;
html = html.replace(oldFilter, newFilter);

// 4. Make the PIN also bring back hidden chats (only for specific chats)
// Inside the filter, if a hidden chat matches the PIN, show it.
const oldPinFilter = `const visibleChats = chats.filter(id => !hiddenChats[id]);`;
const newPinFilter = `const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : '';
    const visibleChats = chats.filter(id => {
       if (hiddenChats[id]) {
          return hiddenChats[id] === searchVal; // Only show if the search bar matches the PIN
       }
       return true;
    });`;
html = html.replace(oldPinFilter, newPinFilter);

fs.writeFileSync('index.html', html);
console.log("✅ Hidden Chats with PIN logic added!");
