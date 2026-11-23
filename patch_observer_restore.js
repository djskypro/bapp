const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const observerJS = `
  // --- GLOBAL VIDEO OBSERVER (RESTORED) ---
  const forceVideos = () => {
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src && img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '250px';
              video.style.width = 'auto';
              video.style.borderRadius = '10px';
              if (img.parentNode) {
                  img.parentNode.replaceChild(video, img);
              }
          }
      });
  };

  setInterval(forceVideos, 500);
  const vObserver = new MutationObserver(() => forceVideos());
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) vObserver.observe(chatContainer, { childList: true, subtree: true });
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + observerJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Global Video Observer restored!');
} else {
    console.log('❌ Could not find script tag.');
}
