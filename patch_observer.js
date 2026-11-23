const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const observerJS = `
  // --- BULLETPROOF VIDEO OBSERVER ---
  // This watches for any raw /media/*.mp4 text and turns it into a video player
  const videoObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                  // Check if the message bubble contains raw .mp4 text
                  const textContent = node.innerText || "";
                  if (textContent.includes('/media/') && textContent.includes('.mp4')) {
                      // Find the exact URL
                      const match = textContent.match(/\\/media\\/[^\\s]+\\.mp4/);
                      if (match) {
                          const videoUrl = match[0];
                          // Clear the bubble and add the video player
                          node.innerHTML = '';
                          const video = document.createElement('video');
                          video.src = videoUrl;
                          video.controls = true;
                          video.style.maxWidth = '100%';
                          video.style.borderRadius = '10px';
                          node.appendChild(video);
                          console.log("🎥 Observer converted video:", videoUrl);
                      }
                  }
              }
          });
      });
  });

  // Start watching the chat container
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) {
      videoObserver.observe(chatContainer, { childList: true, subtree: true });
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + observerJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Bulletproof Video Observer injected!');
} else {
    console.log('❌ Could not find script tag.');
}
