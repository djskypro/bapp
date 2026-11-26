
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Auto popup is disabled. User can install via Settings.
  });

  function installPwa() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed the app');
        }
        deferredPrompt = null;
        const popup = document.getElementById('pwa-install-popup');
        if (popup) popup.style.display = 'none';
      });
    } else {
      alert("To install BAPP, tap the browser menu (⋮) and select 'Add to Home screen'.");
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
