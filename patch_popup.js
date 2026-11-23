const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the popup CSS
const popupCSS = `
<style>
  #msg-popup {
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
  }
  #msg-popup.show {
    top: 30px; /* Slide down to here */
  }
  #msg-popup-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary);
    color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 18px;
    flex-shrink: 0;
  }
  #msg-popup-content {
    flex: 1;
    overflow: hidden;
  }
  #msg-popup-name {
    font-weight: bold;
    font-size: 14px;
    color: var(--primary);
    margin-bottom: 2px;
  }
  #msg-popup-text {
    font-size: 13px;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
</head>`;
html = html.replace('</head>', popupCSS);

// 2. Add the popup HTML right before </body>
const popupHTML = `
<!-- INCOMING MESSAGE POPUP -->
<div id="msg-popup" onclick="openPopupChat()">
  <div id="msg-popup-avatar">A</div>
  <div id="msg-popup-content">
    <div id="msg-popup-name">Sender Name</div>
    <div id="msg-popup-text">Message preview...</div>
  </div>
</div>
`;
html = html.replace('</body>', popupHTML + '</body>');

// 3. Add the popup logic
const popupLogic = `
<script>
  let popupChatId = null;
  let popupTimeout = null;

  function showMessagePopup(senderName, messageText, chatId) {
    // Don't show if we are already in that chat
    if (typeof activeChatId !== 'undefined' && activeChatId === chatId) return;

    popupChatId = chatId;
    document.getElementById('msg-popup-avatar').innerText = senderName.charAt(0).toUpperCase();
    document.getElementById('msg-popup-name').innerText = senderName;
    document.getElementById('msg-popup-text').innerText = messageText;

    const popup = document.getElementById('msg-popup');
    popup.classList.add('show');

    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
      popup.classList.remove('show');
    }, 4000); // Hide after 4 seconds
  }

  function openPopupChat() {
    if (popupChatId) {
      document.getElementById('msg-popup').classList.remove('show');
      openChat(popupChatId);
      popupChatId = null;
    }
  }
</script>
`;
html = html.replace('</body>', popupLogic + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Message Popup UI built!");
