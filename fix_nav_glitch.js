const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force remove ANY existing bottom-nav elements to clear the glitch
// This regex looks for the bottom-nav div and removes it completely
html = html.replace(/<div class="bottom-nav glass"[\s\S]*?<\/div>\s*<\/div>/g, '');
html = html.replace(/<div class="bottom-nav glass"[\s\S]*?<\/div>/g, '');
html = html.replace(/<div class="bottom-nav"[\s\S]*?<\/div>\s*<\/div>/g, '');

// 2. Inject the one and only correct Navigation Bar right at the end of the body
const navHTML = `
<div class="bottom-nav glass" id="main-nav" style="display: flex; z-index: 9999; position: fixed; bottom: 15px; left: 15px; right: 15px; border-radius: 30px;">
  <div class="nav-item active" onclick="goBack()"><span>💬</span>Chats<div class="nav-badge" id="global-badge">0</div></div>
  <div class="nav-item" onclick="openStatusView()"><span>⭕</span>Updates</div>
  <div class="nav-item"><span>📞</span>Calls</div>
  <div class="nav-item" onclick="openSettings()"><span>⚙️</span>Settings</div>
</div>
</body>
`;

html = html.replace('</body>', navHTML);

// 3. Make sure the chat list has padding so the last chat doesn't hide behind the nav
const paddingCSS = `
<style>
  .chat-list {
    padding-bottom: 90px !important;
  }
</style>
</head>
`;
if(!html.includes('.chat-list {\n    padding-bottom: 90px !important;')) {
    html = html.replace('</head>', paddingCSS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Glitch fixed! Only one navigation bar remains.');
