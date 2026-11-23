const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the Popup HTML
const oldPopupHTML = `<!-- INCOMING MESSAGE POPUP -->
<div id="msg-popup" onclick="openPopupChat()">
  <div id="msg-popup-avatar">A</div>
  <div id="msg-popup-content">
    <div id="msg-popup-name">Sender Name</div>
    <div id="msg-popup-text">Message preview...</div>
  </div>
</div>`;

const newPopupHTML = `<!-- INCOMING MESSAGE POPUP -->
<div id="msg-popup" onclick="if(!event.target.closest('#msg-popup-reply-area') && !event.target.closest('#popup-reply-btn')) openPopupChat()">
  <div style="display:flex; align-items:center; gap:15px; width:100%;" id="msg-popup-main-area">
    <div id="msg-popup-avatar">A</div>
    <div id="msg-popup-content">
      <div id="msg-popup-name">Sender Name</div>
      <div id="msg-popup-text">Message preview...</div>
    </div>
    <button id="popup-reply-btn" onclick="togglePopupReply(event)" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:8px 12px; border-radius:10px; font-size:12px; cursor:pointer;">Reply</button>
  </div>
  
  <!-- QUICK REPLY INPUT -->
  <div id="msg-popup-reply-area" style="display:none; width:100%; margin-top:10px; gap:10px;">
    <input type="text" id="popup-reply-input" placeholder="Type a quick reply..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:10px 15px; border-radius:20px; color:white; outline:none; font-size:14px;" onkeypress="if(event.key==='Enter') sendQuickReply()">
    <button onclick="sendQuickReply()" style="background:var(--primary); border:none; width:40px; height:40px; border-radius:50%; color:black; font-size:18px; cursor:pointer; display:flex; justify-content:center; align-items:center;">➤</button>
  </div>
</div>`;
html = html.replace(oldPopupHTML, newPopupHTML);

// 2. Update the Popup CSS to handle the expansion
const oldCSS = `#msg-popup {
    position: fixed;
    top: -100px; /* Hidden above screen */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 400px;
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 15px;
    z-index: 9999999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
  }`;

const newCSS = `#msg-popup {
    position: fixed;
    top: -150px; /* Hidden above screen */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 400px;
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 15px;
    z-index: 9999999;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    transition: top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }
  #msg-popup.replying {
    top: 20px !important; /* Keep visible when replying */
  }
  #msg-popup-reply-area {
    display: none;
    align-items: center;
  }
  #msg-popup.replying #msg-popup-reply-area {
    display: flex;
  }`;
html = html.replace(oldCSS, newCSS);

// 3. Add the Reply Logic
const replyLogic = `
  function togglePopupReply(event) {
    event.stopPropagation();
    const popup = document.getElementById('msg-popup');
    popup.classList.add('replying');
    clearTimeout(popupTimeout); // Stop it from hiding
    document.getElementById('popup-reply-input').focus();
  }

  function sendQuickReply() {
    const input = document.getElementById('popup-reply-input');
    const text = input.value.trim();
    if (!text || !popupChatId) return;

    // Send the message
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'send_message', to: popupChatId, from: myBappId, text: text,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      
      // Save locally
      if (typeof appendMessage === 'function') {
        appendMessage(text, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(popupChatId, payload);
      }
    }

    // Reset popup
    input.value = '';
    const popup = document.getElementById('msg-popup');
    popup.classList.remove('show');
    popup.classList.remove('replying');
    popupChatId = null;
  }
`;
html = html.replace('function openPopupChat()', replyLogic + '\n  function openPopupChat()');

fs.writeFileSync('index.html', html);
console.log("✅ Quick Reply added to popup!");
