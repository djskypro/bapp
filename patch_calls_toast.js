const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. INJECT CUSTOM TOAST & CALL SCREEN CSS
const newCSS = `
<style>
  /* CUSTOM GLASS TOAST (Replaces ugly alerts) */
  #glass-toast {
    position: fixed;
    top: 20px; left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: var(--glass-bg);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid var(--glass-border);
    color: var(--text);
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 99999;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
    opacity: 0;
    text-align: center;
  }
  #glass-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  /* FULL SCREEN CALL UI */
  #call-screen {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 99998;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 60px 20px;
    color: white;
  }
  .call-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .call-header img {
    width: 120px; height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255,255,255,0.2);
    margin-bottom: 20px;
    box-shadow: 0 0 40px rgba(255,255,255,0.1);
  }
  .call-header h2 { font-size: 28px; font-weight: 600; margin-bottom: 5px; }
  .call-status {
    font-size: 16px;
    color: #aaa;
    letter-spacing: 1px;
    animation: pulse 1.5s infinite alternate;
  }
  @keyframes pulse { 0% { opacity: 0.5; } 100% { opacity: 1; } }
  
  .call-actions {
    display: flex;
    gap: 30px;
    margin-bottom: 40px;
  }
  .call-btn {
    width: 70px; height: 70px;
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-size: 28px;
    color: white;
    border: none;
    cursor: pointer;
  }
  .call-btn.end { background: #e74c3c; box-shadow: 0 0 20px rgba(231,76,60,0.4); }
  .call-btn.mute { background: rgba(255,255,255,0.15); }
  .call-btn.speaker { background: rgba(255,255,255,0.15); }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. INJECT HTML FOR TOAST AND CALL SCREEN
const newHTML = `
<div id="glass-toast">Message</div>

<div id="call-screen">
  <div class="call-header">
    <img id="call-avatar" src="">
    <h2 id="call-name">Name</h2>
    <div class="call-status" id="call-status">Calling...</div>
  </div>
  
  <div class="call-actions">
    <button class="call-btn mute" onclick="this.style.color = this.style.color === 'red' ? 'white' : 'red'">🎤</button>
    <button class="call-btn end" onclick="endCall()">📞</button>
    <button class="call-btn speaker" onclick="this.style.color = this.style.color === '#25D366' ? 'white' : '#25D366'">🔊</button>
  </div>
</div>
</body>
`;
html = html.replace('</body>', newHTML);

// 3. OVERRIDE ALERTS & ADD CALL LOGIC
const newJS = `
<script>
  // --- CUSTOM TOAST SYSTEM ---
  function showToast(message) {
    const toast = document.getElementById('glass-toast');
    toast.innerText = message;
    toast.classList.add('show');
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Override the default ugly alert globally!
  window.alert = function(msg) {
    showToast(msg);
  };

  // --- SIMULATED CALLING SYSTEM ---
  let callInterval = null;

  function startCall(type) {
    const name = document.getElementById('chat-name').textContent;
    const avatar = document.getElementById('chat-avatar').src;
    
    document.getElementById('call-name').innerText = name;
    document.getElementById('call-avatar').src = avatar;
    
    const status = document.getElementById('call-status');
    status.innerText = 'Calling...';
    status.style.color = '#aaa';
    status.style.animation = 'pulse 1.5s infinite alternate';
    
    document.getElementById('call-screen').style.display = 'flex';

    // Simulate connecting after 3 seconds
    clearTimeout(callInterval);
    callInterval = setTimeout(() => {
      status.innerText = 'Connected (00:01)';
      status.style.color = '#25D366';
      status.style.animation = 'none';
    }, 3000);
  }

  function endCall() {
    document.getElementById('call-screen').style.display = 'none';
    clearTimeout(callInterval);
  }
</script>
</body>
`;
html = html.replace('</body>', newJS);

fs.writeFileSync('index.html', html);
console.log('✅ Custom glass toasts and iOS-style call screen added!');
