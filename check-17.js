
  let isSyncing = false;
  let syncUpdateInterval = null;

  function openSharedListening() {
    document.getElementById('shared-player').style.display = 'flex';
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function closeSharedListening() {
    document.getElementById('shared-player').style.display = 'none';
    // Stop audio when closing
    const audio = document.getElementById('sync-audio');
    if (audio) { audio.pause(); }
  }

  function loadSyncAudio(url) {
    const audio = document.getElementById('sync-audio');
    if (!url) return;
    audio.src = url;
    audio.load();
    // Send to other person
    socket.send(JSON.stringify({ type: 'sync_music', action: 'load', url: url, chatId: activeChatId }));
  }

  function toggleSyncPlay() {
    const audio = document.getElementById('sync-audio');
    const btn = document.getElementById('sync-play-btn');
    if (!audio.src) return;

    if (audio.paused) {
      audio.play();
      btn.innerText = '⏸';
      isSyncing = true;
      socket.send(JSON.stringify({ type: 'sync_music', action: 'play', time: audio.currentTime, chatId: activeChatId }));
      
      // Update progress bar
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
      socket.send(JSON.stringify({ type: 'sync_music', action: 'pause', time: audio.currentTime, chatId: activeChatId }));
    }
  }

  function seekSyncAudio(val) {
    const audio = document.getElementById('sync-audio');
    if (audio.duration) {
      audio.currentTime = (val / 100) * audio.duration;
      socket.send(JSON.stringify({ type: 'sync_music', action: 'seek', time: audio.currentTime, chatId: activeChatId }));
    }
  }

  // Handle incoming sync messages
  // We hook into the existing message handler by overriding socket.onmessage
  const originalOnMessage = socket.onmessage;
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'sync_music') {
        // Only respond if it's for this chat
        if (data.from !== activeChatId) return; // Only process if it's from the current chat

        const audio = document.getElementById('sync-audio');
        const player = document.getElementById('shared-player');
        const btn = document.getElementById('sync-play-btn');

        // Auto-open the player if it's closed
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
        return; // Stop processing other message types
      }
    } catch(e) {}
    
    // Call the original handler for normal messages
    if (originalOnMessage) originalOnMessage.call(socket, event);
  };
