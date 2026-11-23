const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const globalFixJS = `
  // --- GLOBAL VIDEO FIX (CATCHES EVERY .mp4 IMAGE) ---
  const globalVideoFix = () => {
      // Find ANY img in the chat that has .mp4 in its src
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src && img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '250px';
              video.style.width = 'auto';
              video.style.borderRadius = '10px';
              // Replace the img with the video
              if (img.parentNode) {
                  img.parentNode.replaceChild(video, img);
              }
          }
      });
  };

  // Run immediately, then every 500ms, and whenever the DOM changes
  setInterval(globalVideoFix, 500);

  const globalObserver = new MutationObserver(() => globalVideoFix());
  const globalChatBox = document.getElementById('chat-messages');
  if (globalChatBox) {
      globalObserver.observe(globalChatBox, { childList: true, subtree: true });
  }

  // Also run when the chat view becomes active
  const originalOpenChatForVideo = window.openChat;
  if (originalOpenChatForVideo) {
      window.openChat = function(id, profileObj) {
          originalOpenChatForVideo(id, profileObj);
          setTimeout(globalVideoFix, 100);
          setTimeout(globalVideoFix, 500);
      };
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + globalFixJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Global video fix injected! It will catch EVERY .mp4 img.');
} else {
    console.log('❌ Could not find script tag.');
}
