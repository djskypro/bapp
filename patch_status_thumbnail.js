const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS for the Thumbnail and Loading Ring
const newCSS = `
<style>
  /* My Updates Avatar Container */
  .wa-my-avatar-container {
    width: 55px; height: 55px;
    border-radius: 50%;
    position: relative;
    margin-right: 15px;
    cursor: pointer;
  }
  .wa-my-avatar-base {
    width: 100%; height: 100%;
    border-radius: 50%;
    border: 2px dashed #aaa;
    display: flex; justify-content: center; align-items: center;
    font-size: 24px; color: #aaa;
    box-sizing: border-box;
    overflow: hidden;
  }
  .wa-my-avatar-base img {
    width: 100%; height: 100%; object-fit: cover;
  }
  
  /* Loading Ring */
  .my-loading-ring {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: #25D366;
    animation: spinRing 1s linear infinite;
    display: none;
    box-sizing: border-box;
  }
  @keyframes spinRing {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. Update the "My Updates" HTML structure
const oldMyStatusHTML = `<div class="wa-my-status">
    <div class="wa-my-avatar" onclick="postStatus()">+</div>
    <div onclick="viewMyUpdates()">
      <div class="wa-my-text">My Updates</div>
      <div class="wa-my-sub" id="my-status-time">Tap to add update</div>
    </div>
  </div>`;

const newMyStatusHTML = `<div class="wa-my-status">
    <div class="wa-my-avatar-container" onclick="postStatus()">
      <div class="wa-my-avatar-base" id="my-avatar-base">
        <span id="my-avatar-plus">+</span>
        <img id="my-avatar-img" src="" style="display:none;">
      </div>
      <div class="my-loading-ring" id="my-loading-ring"></div>
    </div>
    <div onclick="viewMyUpdates()">
      <div class="wa-my-text">My Updates</div>
      <div class="wa-my-sub" id="my-status-time">Tap to add update</div>
    </div>
  </div>`;

html = html.replace(oldMyStatusHTML, newMyStatusHTML);

// 3. Update postStatus to show the thumbnail and spinner immediately
const oldPostStart = html.indexOf('  function postStatus() {');
const oldPostEnd = html.indexOf('  function processFile(file) {');

const newPostLogic = `
  function postStatus() {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*,video/*';
    input.multiple = true; 
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      // 1. Show the first file as the thumbnail immediately
      const firstFile = files[0];
      const objectUrl = URL.createObjectURL(firstFile);
      
      const avatarImg = document.getElementById('my-avatar-img');
      const avatarPlus = document.getElementById('my-avatar-plus');
      const loadingRing = document.getElementById('my-loading-ring');
      
      avatarImg.src = objectUrl;
      avatarImg.style.display = 'block';
      avatarPlus.style.display = 'none';
      loadingRing.style.display = 'block'; // Start spinner
      
      // 2. Process (Compress) the files
      pendingStatusMediaArray = [];
      for (const file of files) {
        const base64 = await processFile(file);
        if (base64) pendingStatusMediaArray.push(base64);
      }

      // 3. Upload complete (for now, just stop spinner)
      loadingRing.style.display = 'none'; 
      
      // 4. Show the full preview modal
      if (pendingStatusMediaArray.length > 0) {
        showPreview();
      } else {
        // Reset if failed
        avatarImg.style.display = 'none';
        avatarPlus.style.display = 'block';
      }
    };
    input.click();
  }

`;
html = html.substring(0, oldPostStart) + newPostLogic + html.substring(oldPostEnd);

// 4. Update renderStatuses to show the latest uploaded image if we have one
const oldRenderStatuses = `  function renderStatuses() {
    const container = document.getElementById('status-feed-container');
    container.innerHTML = '';
    
    const userStatuses = {};`;

const newRenderStatuses = `  function renderStatuses() {
    const container = document.getElementById('status-feed-container');
    container.innerHTML = '';
    
    // --- Update My Avatar based on latest status ---
    const myStatuses = activeStatuses.filter(s => s.username === myBappId);
    const avatarImg = document.getElementById('my-avatar-img');
    const avatarPlus = document.getElementById('my-avatar-plus');
    const mySubText = document.getElementById('my-status-time');
    
    if (myStatuses.length > 0) {
        const latest = myStatuses[myStatuses.length - 1];
        if (latest.media) {
            avatarImg.src = latest.media;
            avatarImg.style.display = 'block';
            avatarPlus.style.display = 'none';
            mySubText.innerText = 'Just now';
        }
    } else {
        avatarImg.style.display = 'none';
        avatarPlus.style.display = 'block';
        mySubText.innerText = 'Tap to add update';
    }
    
    const userStatuses = {};`;

html = html.replace(oldRenderStatuses, newRenderStatuses);

fs.writeFileSync('index.html', html);
console.log('✅ Thumbnail preview and loading ring added!');
