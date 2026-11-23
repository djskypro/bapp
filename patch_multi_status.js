const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update CSS for the new segmented progress bars and tap zones
const newCSS = `
<style>
  /* Segmented Progress Bars */
  .status-progress-container {
    display: flex; gap: 4px; padding: 15px; z-index: 2; position: absolute; top: 0; left: 0; right: 0;
  }
  .status-progress-bg {
    flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;
  }
  .status-progress-bar {
    height: 100%; width: 0%; background: white;
  }
  /* Tap Zones for Next/Prev */
  .tap-zone {
    position: absolute; top: 0; bottom: 0; width: 30%; z-index: 2; cursor: pointer;
  }
  .tap-zone.left { left: 0; }
  .tap-zone.right { right: 0; width: 70%; }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. Update the Viewer HTML to include tap zones
const oldViewerHTML = `<div class="status-progress-container">
    <div class="status-progress-bg"><div class="status-progress-bar" id="status-progress"></div></div>
  </div>
  <div class="status-viewer-content" id="status-viewer-content">`;
const newViewerHTML = `<div class="status-progress-container" id="status-progress-container"></div>
  <div class="tap-zone left" onclick="prevStatus()"></div>
  <div class="tap-zone right" onclick="nextStatus()"></div>
  <div class="status-viewer-content" id="status-viewer-content">`;
html = html.replace(oldViewerHTML, newViewerHTML);

// 3. Replace the entire Status JS logic to handle arrays
const oldJSStart = html.indexOf('  let activeStatuses = [];');
const oldJSEnd = html.indexOf('</script>\n</body>');

const newJS = `
  let activeStatuses = [];
  let pendingStatusMediaArray = [];
  
  // Viewer State
  let currentUserStatuses = [];
  let currentStatusIndex = 0;
  let currentViewerTimeout = null;
  let isViewingMyStatus = false;

  function openStatusView() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('status-view').classList.add('active');
    if(socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'get_statuses' }));
    }
  }

  // --- POSTING MULTIPLE ---
  function postStatus() {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*,video/*';
    input.multiple = true; // Allow multiple files
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      pendingStatusMediaArray = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
            alert("Skipped " + file.name + " (over 5MB).");
            continue;
        }
        const base64 = await processFile(file);
        if (base64) pendingStatusMediaArray.push(base64);
      }

      if (pendingStatusMediaArray.length > 0) {
        showPreview();
      }
    };
    input.click();
  }

  function processFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 600; canvas.height = 600 * (img.height / img.width);
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = base64Data;
        } else {
            resolve(base64Data); // Video
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function showPreview() {
    const container = document.getElementById('preview-media-container');
    const firstMedia = pendingStatusMediaArray[0];
    const isVideo = firstMedia.startsWith('data:video');
    
    let html = isVideo 
      ? \`<video src="\${firstMedia}" controls style="width:100%; border-radius:15px;"></video>\` 
      : \`<img src="\${firstMedia}" style="width:100%; border-radius:15px;">\`;
      
    if (pendingStatusMediaArray.length > 1) {
      html += \`<div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:5px 10px; border-radius:10px;">+ \${pendingStatusMediaArray.length - 1} more</div>\`;
      container.style.position = 'relative';
    }
    
    container.innerHTML = html;
    document.getElementById('status-preview-modal').style.display = 'flex';
  }

  function closePreview() {
    document.getElementById('status-preview-modal').style.display = 'none';
    pendingStatusMediaArray = [];
  }

  function confirmPostStatus() {
    if (pendingStatusMediaArray.length > 0) {
      pendingStatusMediaArray.forEach(media => {
        socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: media }));
      });
      closePreview();
      showToast(pendingStatusMediaArray.length + " Updates posted!");
    }
  }

  // --- RENDERING FEED ---
  function renderStatuses() {
    const container = document.getElementById('status-feed-container');
    container.innerHTML = '';
    
    // Group by user
    const userStatuses = {};
    activeStatuses.forEach(s => {
      if (s.username !== myBappId) {
        if (!userStatuses[s.username]) userStatuses[s.username] = [];
        userStatuses[s.username].push(s);
      }
    });

    for (const user in userStatuses) {
      const latest = userStatuses[user][userStatuses[user].length - 1];
      const timeAgo = Math.round((Date.now() - latest.timestamp) / 60000) + " mins ago";
      
      container.innerHTML += \`
        <div class="status-item" onclick='startViewing("\${user}")'>
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

  // --- VIEWER LOGIC ---
  function startViewing(username) {
    isViewingMyStatus = false;
    currentUserStatuses = activeStatuses.filter(s => s.username === username);
    currentStatusIndex = 0;
    
    // Mark all as seen in DB
    currentUserStatuses.forEach(s => {
        socket.send(JSON.stringify({ type: 'view_status', statusId: s.id, viewer: myBappId }));
    });
    
    document.getElementById('viewer-username').innerText = username;
    document.getElementById('status-viewer').style.display = 'flex';
    document.getElementById('status-progress-container').style.display = 'flex';
    
    renderCurrentViewerItem();
  }

  window.viewMyUpdates = function() {
    isViewingMyStatus = true;
    currentUserStatuses = activeStatuses.filter(s => s.username === myBappId);
    if(currentUserStatuses.length === 0) { showToast("No updates yet."); return; }
    currentStatusIndex = 0;
    
    document.getElementById('viewer-username').innerText = "My Updates";
    document.getElementById('status-viewer').style.display = 'flex';
    document.getElementById('status-progress-container').style.display = 'flex';
    
    renderCurrentViewerItem();
  }

  function renderCurrentViewerItem() {
    const status = currentUserStatuses[currentStatusIndex];
    const content = document.getElementById('status-viewer-content');
    const progressContainer = document.getElementById('status-progress-container');
    
    // 1. Render Progress Bars
    progressContainer.innerHTML = '';
    currentUserStatuses.forEach((s, i) => {
        const bg = document.createElement('div');
        bg.className = 'status-progress-bg';
        const bar = document.createElement('div');
        bar.className = 'status-progress-bar';
        if (i < currentStatusIndex) bar.style.width = '100%';
        if (i === currentStatusIndex) {
            setTimeout(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '100%'; }, 50);
        }
        bg.appendChild(bar);
        progressContainer.appendChild(bg);
    });

    // 2. Render Media
    let mediaHTML = status.media.startsWith('data:video') 
        ? \`<video src="\${status.media}" autoplay controls style="max-width:100%; max-height:100%;"></video>\`
        : \`<img src="\${status.media}">\`;
        
    // Add Viewers List if it's my status
    if (isViewingMyStatus) {
      const viewersList = status.views && status.views.length > 0 ? status.views.join(', ') : 'No views yet';
      mediaHTML += \`
        <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); padding:15px; color:white; border-top-left-radius:20px; border-top-right-radius:20px;">
          <div style="font-size:12px; margin-bottom:5px; opacity:0.7;">Seen by (\${status.views ? status.views.length : 0})</div>
          <div style="font-size:14px; max-height:60px; overflow-y:auto;">\${viewersList}</div>
        </div>
      \`;
    }

    content.innerHTML = mediaHTML;

    // 3. Auto-Advance Timer
    clearTimeout(currentViewerTimeout);
    currentViewerTimeout = setTimeout(() => { nextStatus(); }, 5000);
  }

  function nextStatus() {
    if (currentStatusIndex < currentUserStatuses.length - 1) {
      currentStatusIndex++;
      renderCurrentViewerItem();
    } else {
      closeStatusViewer();
    }
  }

  function prevStatus() {
    if (currentStatusIndex > 0) {
      currentStatusIndex--;
      renderCurrentViewerItem();
    }
  }

  function closeStatusViewer() {
    document.getElementById('status-viewer').style.display = 'none';
    clearTimeout(currentViewerTimeout);
  }

  // --- SOCKET SYNC ---
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
      if(data.type !== 'statuses_list' && data.type !== 'new_status') {
         oldSocketStatus.call(socket, event); 
      }
    } catch(err) { oldSocketStatus.call(socket, event); }
  };

  // Prevent clicks on the viewer content from closing it accidentally
  document.getElementById('status-viewer-content').addEventListener('click', (e) => {
    // We let the tap zones handle the clicks
    e.stopPropagation();
  });
`;

html = html.substring(0, oldJSStart) + newJS + html.substring(oldJSEnd);

fs.writeFileSync('index.html', html);
console.log('✅ Multiple posting and tap-to-skip viewer added!');
