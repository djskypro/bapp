const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old reply area from inside the popup
const oldReplyArea = `  <!-- QUICK REPLY INPUT -->
  <div id="msg-popup-reply-area" style="display:none; width:100%; margin-top:10px; gap:10px;">
    <input type="text" id="popup-reply-input" placeholder="Type a quick reply..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:10px 15px; border-radius:20px; color:white; outline:none; font-size:14px;" onkeypress="if(event.key==='Enter') sendQuickReply()">
    <button onclick="sendQuickReply()" style="background:var(--primary); border:none; width:40px; height:40px; border-radius:50%; color:black; font-size:18px; cursor:pointer; display:flex; justify-content:center; align-items:center;">➤</button>
  </div>`;
html = html.replace(oldReplyArea, '');

// 2. Add the new floating reply area right after the popup HTML
const popupEnd = `</div>

<script>
  let popupChatId = null;`;
const newReplyArea = `</div>

<!-- FLOATING QUICK REPLY INPUT -->
<div id="msg-popup-reply-area" style="display:none; position:fixed; top:110px; left:50%; transform:translateX(-50%); width:85%; max-width:350px; z-index:9999999; transition: opacity 0.3s;">
  <div style="display:flex; align-items:center; background:rgba(20, 20, 20, 0.95); backdrop-filter:blur(20px); border:1px solid rgba(255, 255, 255, 0.15); border-radius:25px; padding:5px 5px 5px 15px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
    <input type="text" id="popup-reply-input" placeholder="Type a quick reply..." style="flex:1; background:transparent; border:none; color:white; outline:none; font-size:14px;" onkeypress="if(event.key==='Enter') sendQuickReply()">
    <button onclick="sendQuickReply()" style="background:var(--primary); border:none; width:35px; height:35px; border-radius:50%; color:black; font-size:16px; cursor:pointer; display:flex; justify-content:center; align-items:center;">➤</button>
  </div>
</div>

<script>
  let popupChatId = null;`;
html = html.replace(popupEnd, newReplyArea);

// 3. Update the logic to show/hide the floating reply box
const oldToggle = `function togglePopupReply(event) {
    event.stopPropagation();
    const popup = document.getElementById('msg-popup');
    popup.classList.add('replying');
    clearTimeout(popupTimeout); // Stop it from hiding
    document.getElementById('popup-reply-input').focus();
  }`;
const newToggle = `function togglePopupReply(event) {
    event.stopPropagation();
    clearTimeout(popupTimeout); // Stop popup from hiding
    const replyArea = document.getElementById('msg-popup-reply-area');
    replyArea.style.display = 'block';
    document.getElementById('popup-reply-input').focus();
  }`;

html = html.replace(oldToggle, newToggle);

// 4. Hide the floating box when reply is sent or popup is closed
const oldSend = `    // Reset popup
    input.value = '';
    const popup = document.getElementById('msg-popup');
    popup.classList.remove('show');
    popup.classList.remove('replying');
    popupChatId = null;
  }`;
const newSend = `    // Reset popup
    input.value = '';
    document.getElementById('msg-popup').classList.remove('show');
    document.getElementById('msg-popup-reply-area').style.display = 'none';
    popupChatId = null;
  }`;

html = html.replace(oldSend, newSend);

// Also hide the floating box if the popup auto-closes
const oldTimeout = `    popupTimeout = setTimeout(() => {
      popup.classList.remove('show');
    }, 4000); // Hide after 4 seconds`;
const newTimeout = `    popupTimeout = setTimeout(() => {
      popup.classList.remove('show');
      document.getElementById('msg-popup-reply-area').style.display = 'none';
    }, 4000); // Hide after 4 seconds`;

html = html.replace(oldTimeout, newTimeout);

fs.writeFileSync('index.html', html);
console.log("✅ Floating Quick Reply added below popup!");
