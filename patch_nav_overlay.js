const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Back up first
fs.copyFileSync('index.html', 'index_backup_nav_fix.html');

// 2. Force exact Z-Indexes for the Nav and Status Viewer
const newCSS = `
<style>
  /* NAV BAR OVERLAYS EVERYTHING */
  .bottom-nav {
    z-index: 9000 !important;
    position: fixed !important;
    bottom: 15px !important;
    left: 15px !important;
    right: 15px !important;
    display: flex !important;
  }

  /* STATUS VIEWER OVERLAYS THE NAV BAR */
  #status-viewer {
    z-index: 9999 !important;
  }

  /* MAKE SURE CHAT AND SETTINGS OVERLAY THE MAIN VIEW */
  #chat-view, #settings-view, #contact-info-view {
    z-index: 8000 !important;
    background: var(--bg) !important; /* Solid background to hide main screen */
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 3. Add Show/Hide Nav Functions
const navFunctions = `
  function showNav() {
    const nav = document.querySelector('.bottom-nav');
    if(nav) nav.style.display = 'flex';
  }
  function hideNav() {
    const nav = document.querySelector('.bottom-nav');
    if(nav) nav.style.display = 'none';
  }
`;
html = html.replace("let activeChatId = null;", "let activeChatId = null;\n" + navFunctions);

// 4. Trigger Hide Nav when entering Chat or Settings
html = html.replace("function openChat(id, profileObj) {", "function openChat(id, profileObj) {\n    hideNav();");
html = html.replace("function openSettings() {", "function openSettings() {\n    hideNav();");
html = html.replace("function openContactInfo() {", "function openContactInfo() {\n    hideNav();");

// 5. Trigger Show Nav when going Back to Home or Updates
html = html.replace("function goBack() {", "function goBack() {\n    showNav();");
html = html.replace("function openStatusView() {", "function openStatusView() {\n    showNav();");

// 6. Trigger Hide/Show Nav during Status Viewing
html = html.replace("function startViewing(username) {", "function startViewing(username) {\n    hideNav();");
html = html.replace("window.viewMyUpdates = function() {", "window.viewMyUpdates = function() {\n    hideNav();");
html = html.replace("function closeStatusViewer() {", "function closeStatusViewer() {\n    showNav();");

fs.writeFileSync('index.html', html);
console.log('✅ Nav fixed! It overlays the app, hides in chats, and is covered by statuses.');
