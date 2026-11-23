const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for Status
const statusCSS = `
<style>
  /* Status View Styles */
  #status-view { background: var(--bg); z-index: 40; }
  .status-list { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
  
  .status-item {
    display: flex; align-items: center; gap: 15px; cursor: pointer;
  }
  .status-avatar-ring {
    width: 55px; height: 55px; border-radius: 50%;
    border: 3px solid var(--primary); padding: 2px;
  }
  .status-avatar-ring.seen {
    border-color: var(--text-muted);
  }
  .status-avatar-ring img {
    width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
  }
  .status-info { flex: 1; }
  .status-name { font-size: 16px; font-weight: 600; }
  .status-time { font-size: 12px; color: var(--text-muted); }

  /* Full Screen Viewer */
  #status-viewer {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #000; z-index: 99999; display: none; flex-direction: column;
  }
  .status-progress-container {
    display: flex; gap: 5px; padding: 15px; z-index: 2;
  }
  .status-progress-bg {
    flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;
  }
  .status-progress-bar {
    height: 100%; width: 0%; background: white; transition: width 5s linear;
  }
  .status-viewer-content {
    flex: 1; display: flex; justify-content: center; align-items: center; position: relative;
  }
  .status-viewer-content img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .status-viewer-text { font-size: 32px; color: white; text-align: center; padding: 20px; font-weight: bold; }
  .status-viewer-header {
    position: absolute; top: 40px; left: 20px; right: 20px; display: flex; justify-content: space-between; color: white; z-index: 3;
  }
  .close-status { font-size: 30px; cursor: pointer; color: white; }
</style>
</head>
`;
html = html.replace('</head>', statusCSS);

// 2. Add the Status View HTML right before Settings View
const statusHTML = `
<!-- STATUS VIEW -->
<div id="status-view" class="view">
  <div class="header" style="padding-top: 40px;">
    <h1>Status</h1>
  </div>
  
  <div class="status-list">
    <!-- My Status -->
    <div class="status-item" onclick="postStatus()">
      <div class="status-avatar-ring" style="border-color: var(--text-muted); display:flex; justify-content:center; align-items:center;">
        <span style="font-size:24px; color:var(--text-muted);">+</span>
      </div>
      <div class="status-info">
        <div class="status-name">My Status</div>
        <div class="status-time" id="my-status-time">Tap to add status update</div>
      </div>
    </div>

    <div style="font-size: 14px; font-weight: bold; color: var(--text-muted); margin-top: 10px;">Recent Updates</div>
    
    <!-- List of statuses goes here -->
    <div id="status-feed-container"></div>
  </div>
</div>

<!-- FULL SCREEN STATUS VIEWER -->
<div id="status-viewer">
  <div class="status-viewer-header">
    <div style="font-weight: bold; font-size: 18px;" id="viewer-username">User</div>
    <div class="close-status" onclick="closeStatusViewer()">✕</div>
  </div>
  <div class="status-progress-container">
    <div class="status-progress-bg"><div class="status-progress-bar" id="status-progress"></div></div>
  </div>
  <div class="status-viewer-content" id="status-viewer-content">
    <!-- Content injected here -->
  </div>
</div>
`;

// Insert it before the settings view
html = html.replace('<!-- SETTINGS VIEW -->', statusHTML + '\n<!-- SETTINGS VIEW -->');

// 3. Wire up the Bottom Nav Status Button
html = html.replace('<div class="nav-item"><span>⭕</span>Status</div>', '<div class="nav-item" onclick="openStatusView()"><span>⭕</span>Status</div>');

// 4. Add the JavaScript Logic
const statusJS = `
<script>
  let activeStatuses = [];
  let currentViewerTimeout = null;

  function openStatusView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('status-view').classList.add('active');
    if(socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'get_statuses' }));
    }
  }

  function postStatus() {
    const text = prompt("Enter text for your status (or leave blank to upload a photo):");
    if (text === null) return; // User cancelled

    if (text.trim() !== "") {
      socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: text, media: null }));
    } else {
      // Handle Photo Upload
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          // Compress image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 600 * (img.height / img.width);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: base64 }));
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }

  function renderStatuses() {
    const container = document.getElementById('status-feed-container');
    container.innerHTML = '';
    
    // Group statuses by username (only show latest for now)
    const userStatuses = {};
    activeStatuses.forEach(s => {
      if (s.username !== myBappId) { // Don't show my own in the feed
        if (!userStatuses[s.username]) userStatuses[s.username] = [];
        userStatuses[s.username].push(s);
      }
    });

    for (const user in userStatuses) {
      const latest = userStatuses[user][userStatuses[user].length - 1];
      const timeAgo = Math.round((Date.now() - latest.timestamp) / 60000) + " mins ago";
      
      container.innerHTML += \`
        <div class="status-item" onclick='viewStatus("\${user}")'>
          <div class="status-avatar-ring">
            <img src="https://ui-avatars.com/api/?name=\${user.substring(0,2)}&background=random">
          </div>
          <div class="status-info">
            <div class="status-name">\${user}</div>
            <div class="status-time">\${timeAgo}</div>
          </div>
        </div>
      \`;
    }
  }

  function viewStatus(username) {
    const userStatuses = activeStatuses.filter(s => s.username === username);
    if (userStatuses.length === 0) return;
    
    const status = userStatuses[userStatuses.length - 1]; // Just view the latest
    document.getElementById('viewer-username').innerText = username;
    
    const content = document.getElementById('status-viewer-content');
    content.innerHTML = status.media 
      ? \`<img src="\${status.media}">\` 
      : \`<div class="status-viewer-text">\${status.text}</div>\`;

    document.getElementById('status-viewer').style.display = 'flex';
    
    // Progress Bar Animation
    const bar = document.getElementById('status-progress');
    bar.style.width = '0%';
    setTimeout(() => bar.style.width = '100%', 50);

    clearTimeout(currentViewerTimeout);
    currentViewerTimeout = setTimeout(closeStatusViewer, 5000); // Auto close after 5s
  }

  function closeStatusViewer() {
    document.getElementById('status-viewer').style.display = 'none';
    clearTimeout(currentViewerTimeout);
  }

  // Hook into socket messages
  const oldSocketStatus = socket.onmessage;
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'statuses_list') {
        activeStatuses = data.statuses;
        renderStatuses();
      }
      if (data.type === 'new_status') {
        activeStatuses.push(data.status);
        renderStatuses();
      }
      // Pass to original listener
      if(data.type !== 'statuses_list' && data.type !== 'new_status') {
         oldSocketStatus.call(socket, event); 
      }
    } catch(err) { oldSocketStatus.call(socket, event); }
  };
</script>
</body>
`;
html = html.replace('</body>', statusJS);

fs.writeFileSync('index.html', html);
console.log('✅ Status UI and Logic added!');
