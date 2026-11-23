const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the broken script block at the bottom
const brokenBlockRegex = /<script>\s*let isSyncing = false;[\s\S]*?<\/script>\s*<\/body>/;
html = html.replace(brokenBlockRegex, '</body>');

// 2. Re-inject the JS safely at the end of the body, but wait for socket to exist
const safeSyncJS = `
<script>
  let isSyncing = false;
  let syncUpdateInterval = null;

  function openSharedListening() {
    document.getElementById('shared-player').style.display = 'flex';
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function closeSharedListening() {
    document.getElementById('shared-player').style.display = 'none';
    const audio = document.getElementById('sync-audio');
    if (audio) { audio.pause(); }
  }

  function loadSyncAudio(url) {
    const audio = document.getElementById('sync-audio');
    if (!url) return;
    audio.src = url;
    audio.load();
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'sync_music', action: 'load', url: url, chatId: activeChatId }));
    }
  }

  function toggleSyncPlay() {
    const audio = document.getElementById('sync-audio');
    const btn = document.getElementById('sync-play-btn');
    if (!audio.src) return;

    if (audio.paused) {
      audio.play();
      btn.innerText = '⏸';
      isSyncing = true;
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'sync_music', action: 'play', time: audio.currentTime, chatId: activeChatId }));
      }
      
      syncUpdateInterval = setInterval(() => {
        if(audio.duration) {
          document.getElementById('sync-progress').value = (audio.currentTime / audio.duration) * 100;
          document.getElementById('sync-time').innerText = Math.floor(audio.currentTime) + 's';
        }
      }, 1000);
    } else {
      audio.pause();
      btn.innerText = '▶';
      isSyncing = false;
      clearInterval(syncUpdateInterval);
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'sync_music', action: 'pause', time: audio.currentTime, chatId: activeChatId }));
      }
    }
  }

  function seekSyncAudio(val) {
    const audio = document.getElementById('sync-audio');
    if (audio.duration) {
      audio.currentTime = (val / 100) * audio.duration;
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'sync_music', action: 'seek', time: audio.currentTime, chatId: activeChatId }));
      }
    }
  }

  // Safe way to hook into the WebSocket messages
  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasSyncHook) {
      socket.hasSyncHook = true; // Prevent double hooking
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync_music') {
            if (data.chatId !== activeChatId) return;
            
            const audio = document.getElementById('sync-audio');
            const player = document.getElementById('shared-player');
            const btn = document.getElementById('sync-play-btn');

            if (player.style.display === 'none') {
               player.style.display = 'flex';
            }

            if (data.action === 'load') {
              audio.src = data.url;
              audio.load();
              document.getElementById('sync-url-input').value = data.url;
            } else if (data.action === 'play') {
              audio.currentTime = data.time;
              audio.play();
              btn.innerText = '⏸';
            } else if (data.action === 'pause') {
              audio.pause();
              audio.currentTime = data.time;
              btn.innerText = '▶';
            } else if (data.action === 'seek') {
              audio.currentTime = data.time;
            }
            return; 
          }
        } catch(e) {}
        
        if (originalHandler) originalHandler.call(socket, event);
      };
    }
  }, 1000); // Check every second if socket is ready
</script>
</body>`;
html = html.replace('</body>', safeSyncJS);
fs.writeFileSync('index.html', html);
console.log("✅ 3-Dots fixed! Socket hook is now safe.");
