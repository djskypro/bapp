const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix closeFullscreenMedia to use replaceState instead of history.back()
const oldClose = `  function closeFullscreenMedia() {
    document.getElementById('full-image-viewer').style.display = 'none';
    // If we are on the #image state, go back to fix history
    if (window.location.hash === '#image') history.back();
  }`;

const newClose = `  function closeFullscreenMedia() {
    document.getElementById('full-image-viewer').style.display = 'none';
    // Use replaceState so it doesn't trigger the popstate event!
    if (window.location.hash === '#image') {
        history.replaceState({ view: 'chat' }, '', '#chat');
    }
  }`;
html = html.replace(oldClose, newClose);

// 2. Fix the popstate event so it doesn't accidentally trigger resetToHome
const oldPopstate = `  window.addEventListener('popstate', function(event) {
    // Check if the full screen image viewer is open
    const imgViewer = document.getElementById('full-image-viewer');
    if (imgViewer && imgViewer.style.display === 'flex') {
        closeFullscreenMedia();
        history.pushState({ view: 'chat' }, '', '#chat'); // Stay in chat
        return;
    }
    // Otherwise, reset the UI to home
    resetToHome();
  });`;

const newPopstate = `  window.addEventListener('popstate', function(event) {
    // Check if the full screen image viewer is open
    const imgViewer = document.getElementById('full-image-viewer');
    if (imgViewer && imgViewer.style.display === 'flex') {
        // Just hide the viewer, history already moved back
        imgViewer.style.display = 'none';
        return;
    }
    // Otherwise, reset the UI to home
    resetToHome();
  });`;
html = html.replace(oldPopstate, newPopstate);

fs.writeFileSync('index.html', html);
console.log('✅ Fixed! X button and edge swipe will now keep you in the chat.');
