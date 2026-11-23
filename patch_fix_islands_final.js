const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD BULLETPROOF CSS FOR THE 3 ISLANDS
const islandCSS = `
<style>
  /* FORCE HEADER TO BE VISIBLE AND FLOATING */
  .chat-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 0 5px !important;
    position: absolute !important;
    top: 15px !important;
    left: 15px !important;
    right: 15px !important;
    z-index: 9999 !important; /* Force it above messages */
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* THE GLASS ISLAND STYLE */
  .glass-island {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(25px) !important;
    -webkit-backdrop-filter: blur(25px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 25px !important; /* Curved edges */
    box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 50px !important;
  }

  /* ISLAND 1: BACK BUTTON */
  .chat-header .back-btn {
    width: 50px !important;
    margin: 0 !important;
    font-size: 22px !important;
    color: var(--primary) !important;
    cursor: pointer !important;
  }

  /* ISLAND 2: PROFILE */
  .profile-island {
    flex: 1 !important;
    padding: 0 15px 0 5px !important;
    gap: 10px !important;
    cursor: pointer !important;
    justify-content: flex-start !important;
  }
  .profile-island .avatar {
    margin: 0 !important;
    width: 38px !important;
    height: 38px !important;
  }

  /* ISLAND 3: ACTIONS */
  .header-action-icons {
    padding: 0 15px !important;
    gap: 15px !important;
    font-size: 20px !important;
    color: var(--primary) !important;
  }
  
  /* Make sure messages don't hide behind the header */
  .messages {
    padding-top: 80px !important;
  }
</style>
</head>
`;
html = html.replace('</head>', islandCSS);

// 2. REPLACE THE ENTIRE HEADER HTML SAFELY
// We find the start of the chat-header and the start of the messages container
const startIdx = html.indexOf('<div class="chat-header">');
const endIdx = html.indexOf('<div class="messages"');

if (startIdx !== -1 && endIdx !== -1) {
    const newHeaderHTML = `<div class="chat-header">
    <!-- ISLAND 1: BACK BUTTON -->
    <div class="back-btn glass-island" onclick="goBack()">←</div>
    
    <!-- ISLAND 2: PROFILE, NAME, TYPING -->
    <div class="profile-island glass-island" onclick="openContactInfo()">
      <img src="" id="chat-avatar" class="avatar">
      <div>
        <div class="name" id="chat-name"></div>
        <div class="lock" id="chat-subtitle">🔒 End-to-End Encrypted</div>
      </div>
    </div>
    
    <!-- ISLAND 3: CALLS & MENU -->
    <div class="header-action-icons glass-island">
      <span onclick="startCall('video')" style="cursor:pointer;">📹</span>
      <span onclick="startCall('audio')" style="cursor:pointer;">📞</span>
      <span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>
    </div>
  </div>
  
  `;
    html = html.substring(0, startIdx) + newHeaderHTML + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ 3 Islands forcefully injected and CSS fixed!');
} else {
    console.log('❌ Could not find boundaries to replace the header.');
}
