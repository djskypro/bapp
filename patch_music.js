const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the button to the 3-dot menu
const menuButton = `
    <div onclick="openSharedListening()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer; margin-top:10px;">
      <span style="font-size:20px;">🎵</span>
      <span style="font-size:16px; font-weight:500;">Shared Listening</span>
    </div>
`;
html = html.replace('<div onclick="clearCurrentChat()"', menuButton + '<div onclick="clearCurrentChat()"');

// 2. Add the UI for the Shared Listening player
const playerUI = `
<!-- SHARED LISTENING PLAYER -->
<div id="shared-player" style="display:none; position:fixed; bottom:90px; left:25px; right:25px; background:rgba(25,25,25,0.95); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:15px; z-index:999999; flex-direction:column; gap:10px; box-shadow:0 10px 30px rgba(0,0,0,0.6);">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:14px;">🎵 Synced Session</span>
    <span onclick="closeSharedListening()" style="cursor:pointer; font-size:18px;">✕</span>
  </div>
  <div style="display:flex; align-items:center; gap:15px;">
    <button id="sync-play-btn" onclick="toggleSyncPlay()" style="background:var(--primary); border:none; border-radius:50%; width:40px; height:40px; font-size:18px; cursor:pointer; color:black;">▶</button>
    <input type="range" id="sync-progress" min="0" max="100" value="0" style="flex:1;" oninput="seekSyncAudio(this.value)">
    <span id="sync-time" style="font-size:12px; color:#aaa;">0:00</span>
  </div>
  <div style="font-size:11px; color:var(--text-muted); text-align:center;">Paste a direct audio URL to sync</div>
  <input type="text" id="sync-url-input" placeholder="https://...mp3" style="background:rgba(0,0,0,0.5); border:none; padding:8px; border-radius:8px; color:white;" onchange="loadSyncAudio(this.value)">
  <audio id="sync-audio" style="display:none;"></audio>
</div>
`;
html = html.replace('</body>', playerUI + '</body>');

// 3. Add the JavaScript logic for Shared Listening
const syncJS = `
<script>
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
        if (data.chatId !== activeChatId) return;

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
</script>
`;
html = html.replace('</body>', syncJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Shared Listening added to chat menu!");
