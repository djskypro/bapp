const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Track Viewers)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add views array to new statuses
serverJs = serverJs.replace(
    "media: data.media,\n                timestamp: Date.now()",
    "media: data.media,\n                views: [],\n                timestamp: Date.now()"
);

// Add the view_status tracker
const viewTracker = `
        if (data.type === 'view_status') {
            let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));
            let status = statuses.find(s => s.id === data.statusId);
            if (status && !status.views.includes(data.viewer)) {
                status.views.push(data.viewer);
                fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
            }
        }
`;
if(!serverJs.includes("data.type === 'view_status'")) {
    serverJs = serverJs.replace("if (data.type === 'register_user') {", viewTracker + "\n        if (data.type === 'register_user') {");
}
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. UPDATE CLIENT (Preview Modal & Viewers)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add the Preview Modal HTML & Viewer Overlay updates
const newHTML = `
  <!-- Status Preview Modal -->
  <div id="status-preview-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:99998; flex-direction:column; justify-content:center; align-items:center;">
    <div id="preview-media-container" style="max-width:90%; max-height:70vh; overflow:hidden; border-radius:15px; margin-bottom:20px;"></div>
    <div style="display:flex; gap:20px;">
      <button onclick="closePreview()" style="padding:10px 30px; border-radius:20px; border:none; background:#555; color:white; font-size:16px;">Cancel</button>
      <button onclick="confirmPostStatus()" style="padding:10px 30px; border-radius:20px; border:none; background:var(--primary); color:black; font-weight:bold; font-size:16px;">Post Update</button>
    </div>
  </div>
`;

// Insert the modal right before the closing body tag
html = html.replace('</body>', newHTML + '\n</body>');

// Update the "My Updates" click handler to distinguish between viewing and posting
html = html.replace('<div class="status-item" onclick="postStatus()">', '<div class="status-item">');
html = html.replace('<div class="status-avatar-ring" style="border-color: var(--text-muted); display:flex; justify-content:center; align-items:center;">\n        <span style="font-size:24px; color:var(--text-muted);">+</span>\n      </div>', '<div class="status-avatar-ring" onclick="postStatus()" style="border-color: var(--text-muted); display:flex; justify-content:center; align-items:center;">\n        <span style="font-size:24px; color:var(--text-muted);">+</span>\n      </div>');
html = html.replace('<div class="status-info">\n        <div class="status-name">My Updates</div>\n        <div class="status-time" id="my-status-time">Tap to add update</div>\n      </div>', '<div class="status-info" onclick="viewMyUpdates()">\n        <div class="status-name">My Updates</div>\n        <div class="status-time" id="my-status-time">Tap to view my update</div>\n      </div>');

// B. Add the new JavaScript logic
const newJS = `
<script>
  let pendingStatusMedia = null;
  let pendingStatusType = null;

  // 1. Replace Post Status to show Preview
  window.postStatus = function() {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*,video/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
          alert("Please select a file smaller than 5MB.");
          return;
      }

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
              
              pendingStatusMedia = canvas.toDataURL('image/jpeg', 0.6);
              pendingStatusType = 'image';
              
              document.getElementById('preview-media-container').innerHTML = \`<img src="\${pendingStatusMedia}" style="width:100%; border-radius:15px;">\`;
              document.getElementById('status-preview-modal').style.display = 'flex';
            };
            img.src = base64Data;
        } else if (file.type.startsWith('video/')) {
            pendingStatusMedia = base64Data;
            pendingStatusType = 'video';
            
            document.getElementById('preview-media-container').innerHTML = \`<video src="\${pendingStatusMedia}" controls style="width:100%; border-radius:15px;"></video>\`;
            document.getElementById('status-preview-modal').style.display = 'flex';
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  window.closePreview = function() {
    document.getElementById('status-preview-modal').style.display = 'none';
    document.getElementById('preview-media-container').innerHTML = '';
    pendingStatusMedia = null;
  };

  window.confirmPostStatus = function() {
    if (pendingStatusMedia) {
      socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: pendingStatusMedia }));
      closePreview();
      showToast("Update posted successfully!");
    }
  };

  // 2. View My Updates (with viewers list)
  window.viewMyUpdates = function() {
    const myStatus = activeStatuses.filter(s => s.username === myBappId).pop();
    
    if (!myStatus) {
      showToast("You haven't posted an update yet. Tap the '+' to add one.");
      return;
    }

    document.getElementById('viewer-username').innerText = "My Updates";
    
    const content = document.getElementById('status-viewer-content');
    let mediaHTML = myStatus.media.startsWith('data:video') 
        ? \`<video src="\${myStatus.media}" autoplay controls style="max-width:100%; max-height:100%;"></video>\`
        : \`<img src="\${myStatus.media}">\`;

    // Add the Viewers List at the bottom
    const viewersHTML = \`
      <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); padding:15px; color:white; border-top-left-radius:20px; border-top-right-radius:20px;">
        <div style="font-size:12px; margin-bottom:5px; opacity:0.7;">Seen by</div>
        <div style="font-size:14px;">\${myStatus.views && myStatus.views.length > 0 ? myStatus.views.join(', ') : 'No views yet'}</div>
      </div>
    \`;

    content.innerHTML = mediaHTML + viewersHTML;
    document.getElementById('status-viewer').style.display = 'flex';
    
    // No progress bar for my own status
    document.getElementById('status-progress').style.display = 'none';
  };

  // 3. Update the original viewer to send "view_status" signal
  const originalViewStatus = window.viewStatus;
  window.viewStatus = function(username) {
    const userStatus = activeStatuses.filter(s => s.username === username).pop();
    if (userStatus) {
        // Send view signal to server
        socket.send(JSON.stringify({ type: 'view_status', statusId: userStatus.id, viewer: myBappId }));
    }
    // Call original function to show the image
    originalViewStatus(username);
    document.getElementById('status-progress').style.display = 'block'; // Ensure progress is back
  };
</script>
</body>
`;

html = html.replace('</body>', newJS);
fs.writeFileSync('index.html', html);
console.log('✅ Preview modal and Viewers List added!');
