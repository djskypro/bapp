const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixJS = `
  // --- FINAL VIDEO FIX ---
  // This forces any broken image with a .mp4 link to become a video player
  const fixVideos = () => {
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '100%';
              video.style.borderRadius = '10px';
              img.parentNode.replaceChild(video, img);
          }
      });
  };

  // Run it every time a new message appears
  const observer = new MutationObserver(() => { fixVideos(); });
  const chatBox = document.getElementById('chat-messages');
  if (chatBox) observer.observe(chatBox, { childList: true, subtree: true });

  // Also run it once when the chat opens
  setInterval(fixVideos, 1000);
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + fixJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Video replacement injected!');
} else {
    console.log('❌ Could not find script tag.');
}
