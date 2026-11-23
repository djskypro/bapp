const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX THE SCROLLING & LAYOUT GLITCH
const layoutCSS = `
<style>
  /* Force the Updates page to fit the screen properly */
  #status-view {
    display: flex;
    flex-direction: column;
    height: 100dvh !important;
    overflow: hidden !important;
    background: var(--bg) !important;
  }
  
  /* Make the list scrollable, leaving space for the bottom nav */
  #status-feed-container {
    flex: 1;
    overflow-y: auto !important;
    padding-bottom: 100px !important; 
  }

  /* The avatar ring container */
  .wa-my-avatar-container {
    width: 55px; height: 55px;
    border-radius: 50%;
    position: relative;
    margin-right: 15px;
    cursor: pointer;
  }

  /* Base circle (Dashed when no status, Solid White when posted) */
  .wa-my-avatar-base {
    width: 100%; height: 100%;
    border-radius: 50%;
    border: 2px dashed #aaa;
    display: flex; justify-content: center; align-items: center;
    font-size: 24px; color: #aaa;
    box-sizing: border-box;
    overflow: hidden;
    transition: border 0.3s;
  }
  .wa-my-avatar-base.has-status {
    border: 2px solid #ffffff; /* White ring when done */
  }
  .wa-my-avatar-base img {
    width: 100%; height: 100%; object-fit: cover;
  }
  
  /* Loading Ring (Green) */
  .my-loading-ring {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: #25D366; /* Green */
    animation: spinRing 1s linear infinite;
    display: none;
    box-sizing: border-box;
    z-index: 2;
  }
  @keyframes spinRing {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
</head>
`;
html = html.replace('</head>', layoutCSS);

// 2. UPDATE THE JS FOR THE RING & POSTING LOGIC
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
      
      const firstFile = files[0];
      const objectUrl = URL.createObjectURL(firstFile);
      
      const avatarImg = document.getElementById('my-avatar-img');
      const avatarPlus = document.getElementById('my-avatar-plus');
      const loadingRing = document.getElementById('my-loading-ring');
      const avatarBase = document.getElementById('my-avatar-base');
      
      // 1. Show Thumbnail & Green Spinner
      avatarImg.src = objectUrl;
      avatarImg.style.display = 'block';
      avatarPlus.style.display = 'none';
      loadingRing.style.display = 'block'; 
      avatarBase.classList.remove('has-status'); // Remove white ring while loading
      
      // 2. Compress Files
      pendingStatusMediaArray = [];
      for (const file of files) {
        const base64 = await processFile(file);
        if (base64) pendingStatusMediaArray.push(base64);
      }

      // 3. Loading Done
      loadingRing.style.display = 'none'; 
      
      if (pendingStatusMediaArray.length > 0) {
        showPreview();
      } else {
        avatarImg.style.display = 'none';
        avatarPlus.style.display = 'block';
      }
    };
    input.click();
  }

  function closePreview() {
    document.getElementById('status-preview-modal').style.display = 'none';
    pendingStatusMediaArray = [];
    
    // If cancelled, revert ring if no status exists
    const myStatuses = activeStatuses.filter(s => s.username === myBappId);
    if (myStatuses.length === 0) {
        document.getElementById('my-avatar-img').style.display = 'none';
        document.getElementById('my-avatar-plus').style.display = 'block';
        document.getElementById('my-avatar-base').classList.remove('has-status');
    }
  }

  function confirmPostStatus() {
    if (pendingStatusMediaArray.length > 0) {
      document.getElementById('loading-overlay').style.display = 'flex';
      pendingStatusMediaArray.forEach(media => {
        socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: media }));
      });
      
      setTimeout(() => {
        document.getElementById('loading-overlay').style.display = 'none';
        closePreview();
        showToast(pendingStatusMediaArray.length + " Update(s) posted!");
        
        // Turn the ring White immediately after posting
        document.getElementById('my-avatar-base').classList.add('has-status');
      }, 1000);
    }
  }

`;
html = html.substring(0, oldPostStart) + newPostLogic + html.substring(oldPostEnd);

// 3. UPDATE RENDERSTATUSES TO SET WHITE RING ON LOAD
const oldRenderStatuses = `    if (myStatuses.length > 0) {
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
    }`;

const newRenderStatuses = `    if (myStatuses.length > 0) {
        const latest = myStatuses[myStatuses.length - 1];
        if (latest.media) {
            avatarImg.src = latest.media;
            avatarImg.style.display = 'block';
            avatarPlus.style.display = 'none';
            mySubText.innerText = 'Just now';
            
            // Add the solid white ring
            document.getElementById('my-avatar-base').classList.add('has-status');
        }
    } else {
        avatarImg.style.display = 'none';
        avatarPlus.style.display = 'block';
        mySubText.innerText = 'Tap to add update';
        document.getElementById('my-avatar-base').classList.remove('has-status');
    }`;

html = html.replace(oldRenderStatuses, newRenderStatuses);

fs.writeFileSync('index.html', html);
console.log('✅ Updates layout fixed and Ring logic (Green->White) applied!');
