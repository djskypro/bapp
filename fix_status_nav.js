const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Move the Bottom Nav outside of the main view so it doesn't disappear when switching tabs
const navHTML = `<div class="bottom-nav glass" id="main-nav" style="display: flex; z-index: 9999;">
    <div class="nav-item active" onclick="goBack()"><span>💬</span>Chats<div class="nav-badge" id="global-badge">0</div></div>
    <div class="nav-item" onclick="openStatusView()"><span>⭕</span>Updates</div>
    <div class="nav-item"><span>📞</span>Calls</div>
    <div class="nav-item" onclick="openSettings()"><span>⚙️</span>Settings</div>
  </div>`;

// Remove old nav
html = html.replace(/<div class="bottom-nav glass">[\s\S]*?<\/div>\s*<\/div>/, '');
// Add new nav right before closing body
html = html.replace('</body>', navHTML + '\n</body>');

// 2. Update the Status Viewer Header to have a clear Back Button
const oldHeader = `<div class="status-viewer-header">
    <div style="font-weight: bold; font-size: 18px;" id="viewer-username">User</div>
    <div class="close-status" onclick="closeStatusViewer()">✕</div>
  </div>`;

const newHeader = `<div class="status-viewer-header" style="background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); padding-bottom: 20px;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div onclick="closeStatusViewer()" style="cursor:pointer; font-size:28px; color:white; font-weight:bold; padding-right:10px;">←</div>
      <div style="font-weight: bold; font-size: 18px;" id="viewer-username">User</div>
    </div>
    <div onclick="closeStatusViewer()" style="cursor:pointer; font-size:24px; color:white;">✕</div>
  </div>`;

html = html.replace(oldHeader, newHeader);

// 3. Add the showNav and hideNav logic
const navLogic = `
  function showNav() { const n = document.getElementById('main-nav'); if(n) n.style.display = 'flex'; }
  function hideNav() { const n = document.getElementById('main-nav'); if(n) n.style.display = 'none'; }
`;

// 4. Inject hide/show calls into the navigation functions
// When going back to home, show nav
html = html.replace("function goBack() {\n    activeChatId = null;", "function goBack() {\n    showNav();\n    activeChatId = null;");

// When opening chat or settings, hide nav
html = html.replace("function openChat(id, profileObj) {", "function openChat(id, profileObj) {\n    hideNav();");
html = html.replace("function openSettings() {", "function openSettings() {\n    hideNav();");
html = html.replace("function openContactInfo() {", "function openContactInfo() {\n    hideNav();");

// When opening Updates tab, SHOW nav
html = html.replace("function openStatusView() {", "function openStatusView() {\n    showNav();");

// When viewing a status, HIDE nav
html = html.replace("function startViewing(username) {", "function startViewing(username) {\n    hideNav();");
html = html.replace("window.viewMyUpdates = function() {", "window.viewMyUpdates = function() {\n    hideNav();");

// When closing status viewer, SHOW nav
html = html.replace("function closeStatusViewer() {", "function closeStatusViewer() {\n    showNav();");

// Inject the nav logic into the script
html = html.replace("let activeStatuses = [];", navLogic + "\n  let activeStatuses = [];");

fs.writeFileSync('index.html', html);
console.log('✅ Navigation fixed! Bottom nav stays on Updates, hides on Viewer, and Clear Back buttons added.');
