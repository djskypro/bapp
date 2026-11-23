const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add history.pushState to openChat (Line 1593)
const oldOpenChat = `  function openChat(id, profileObj) {
    // --- RESTORE REPLY STATE FOR THIS CHAT ---`;
const newOpenChat = `  function openChat(id, profileObj) {
    history.pushState({ view: 'chat' }, '', '#chat');
    // --- RESTORE REPLY STATE FOR THIS CHAT ---`;
html = html.replace(oldOpenChat, newOpenChat);

// 2. Add history.pushState to openSettings (Line 1972)
const oldOpenSettings = `  function openSettings() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));`;
const newOpenSettings = `  function openSettings() {
    history.pushState({ view: 'settings' }, '', '#settings');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));`;
html = html.replace(oldOpenSettings, newOpenSettings);

// 3. Rewrite the goBack function (Line 1648)
// We rename the old UI logic to resetToHome(), and make goBack() trigger the browser history.
const oldGoBack = `  function goBack() {
    activeChatId = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
  }`;

const newGoBack = `  // This function resets the UI to the main screen
  function resetToHome() {
    activeChatId = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
  }

  // This function is called by your back buttons
  function goBack() {
    // If there is history to go back to, trigger it
    if (window.history.length > 1) {
      history.back();
    } else {
      // If no history, just reset the UI
      resetToHome();
    }
  }

  // Listen for the Android Hardware Back Button
  window.addEventListener('popstate', function(event) {
    // When the hardware back button is pressed, reset the UI
    resetToHome();
  });`;

html = html.replace(oldGoBack, newGoBack);

// 4. Add pushState to openStatusView and openContactInfo for completeness
html = html.replace("function openStatusView() {", "function openStatusView() {\n    history.pushState({ view: 'updates' }, '', '#updates');");
if(html.includes("function openContactInfo() {")) {
    html = html.replace("function openContactInfo() {", "function openContactInfo() {\n    history.pushState({ view: 'contact' }, '', '#contact');");
}

fs.writeFileSync('index.html', html);
console.log('✅ Hardware back button support added!');
