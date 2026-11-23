const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add an "X" close button to the image viewer HTML
const oldViewerHTML = `<div id="simple-img-viewer">
  <img id="simple-full-img" src="">
</div>`;

const newViewerHTML = `<div id="simple-img-viewer">
  <div id="simple-img-close" style="position:absolute; top:20px; left:20px; width:45px; height:45px; background:rgba(255,255,255,0.2); backdrop-filter:blur(10px); border-radius:50%; display:flex; justify-content:center; align-items:center; color:white; font-size:24px; cursor:pointer; z-index:10000000;">✕</div>
  <img id="simple-full-img" src="">
</div>`;

if(html.includes(oldViewerHTML)) {
    html = html.replace(oldViewerHTML, newViewerHTML);
}

// 2. Update the JS to handle the X button and fix the popstate (hardware back)
const viewerJS = `
  // --- FIX BACK BUTTON FOR IMAGE VIEWER ---
  
  // A. Handle the X button click
  document.getElementById('simple-img-close').addEventListener('click', function(e) {
    e.stopPropagation(); // Stop the tap from closing the viewer twice
    document.getElementById('simple-img-viewer').style.display = 'none';
    // Go back in history to match the state
    if(window.location.hash === '#image') history.back();
  });

  // B. Handle the Hardware Back Button (popstate)
  const originalPopstate = window.onpopstate;
  window.addEventListener('popstate', function(event) {
    const viewer = document.getElementById('simple-img-viewer');
    if (viewer && viewer.style.display === 'flex') {
      viewer.style.display = 'none'; // Close the viewer
      // Push the chat state back so we don't accidentally exit the chat
      history.pushState({ view: 'chat' }, '', '#chat'); 
      return;
    }
    if(typeof resetToHome === 'function') {
        resetToHome();
    }
  });

  // C. Handle the Edge Swipe (override the handleBackGesture function)
  if (typeof handleBackGesture === 'function') {
      const originalEdgeBack = handleBackGesture;
      window.handleBackGesture = function() {
          const viewer = document.getElementById('simple-img-viewer');
          if (viewer && viewer.style.display === 'flex') {
              viewer.style.display = 'none';
              if(window.location.hash === '#image') history.back();
              return;
          }
          originalEdgeBack();
      };
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + viewerJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Image Viewer Back Button and X button fixed!');
} else {
    console.log('❌ Could not find script tag.');
}
