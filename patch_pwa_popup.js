const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the CSS for the popup
const pwaCSS = `
<style>
  #pwa-install-popup {
    display: none; 
    position: fixed; 
    bottom: 90px; /* Above the bottom nav */
    left: 20px; 
    right: 20px; 
    background: rgba(20, 20, 20, 0.95); 
    backdrop-filter: blur(20px); 
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15); 
    border-radius: 20px; 
    padding: 20px; 
    z-index: 9999999; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
    flex-direction: column; 
    gap: 15px; 
    align-items: center; 
    text-align: center;
    animation: slideUpPwa 0.4s ease-out;
  }
  @keyframes slideUpPwa {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .pwa-btn {
    flex: 1; 
    padding: 12px; 
    border-radius: 12px; 
    border: none; 
    font-weight: bold; 
    font-size: 14px;
    cursor: pointer;
  }
</style>
</head>`;
html = html.replace('</head>', pwaCSS);

// 2. Add the HTML and JS right before </body>
const pwaHTML = `
<!-- PWA INSTALL POPUP -->
<div id="pwa-install-popup">
  <div style="font-size: 30px;">📱</div>
  <div>
    <h3 style="margin: 0; color: var(--primary); font-size: 18px;">Install BAPP</h3>
    <p style="margin: 5px 0 0 0; font-size: 13px; color: #aaa;">Add to your home screen for a faster, full-screen experience.</p>
  </div>
  <div style="display: flex; gap: 10px; width: 100%; margin-top: 5px;">
    <button onclick="dismissPwaPopup()" class="pwa-btn" style="background: rgba(255,255,255,0.1); color: white;">Later</button>
    <button onclick="installPwa()" class="pwa-btn" style="background: var(--primary); color: black;">Install App</button>
  </div>
</div>

<script>
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Only show if they haven't dismissed it recently
    if (!localStorage.getItem('pwa_dismissed_recently')) {
      setTimeout(() => {
        document.getElementById('pwa-install-popup').style.display = 'flex';
      }, 3000); // Show after 3 seconds so it doesn't block the initial load
    }
  });

  function installPwa() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed the app');
        }
        deferredPrompt = null;
        document.getElementById('pwa-install-popup').style.display = 'none';
      });
    }
  }

  function dismissPwaPopup() {
    document.getElementById('pwa-install-popup').style.display = 'none';
    // Hide it for 3 days so it doesn't annoy the user
    localStorage.setItem('pwa_dismissed_recently', Date.now() + 259200000); 
  }
  
  // Check if they dismissed it recently on load
  window.addEventListener('load', () => {
    const dismissedTime = localStorage.getItem('pwa_dismissed_recently');
    if (dismissedTime && Date.now() < parseInt(dismissedTime)) {
      // Do nothing, they dismissed it
    } else {
       localStorage.removeItem('pwa_dismissed_recently');
    }
  });
</script>
</body>`;
html = html.replace('</body>', pwaHTML);

fs.writeFileSync('index.html', html);
console.log("✅ Beautiful PWA Install Popup injected!");
