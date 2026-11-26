
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
      if (caches) {
        caches.keys().then(function(names) {
          for (let name of names) caches.delete(name);
        });
      }
    });
  }

  // --- GLOBAL VIDEO OBSERVER (RESTORED) ---
  const forceVideos = () => {
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src && img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '250px';
              video.style.width = 'auto';
              video.style.borderRadius = '10px';
              if (img.parentNode) {
                  img.parentNode.replaceChild(video, img);
              }
          }
      });
  };

  setInterval(forceVideos, 500);
  const vObserver = new MutationObserver(() => forceVideos());
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) vObserver.observe(chatContainer, { childList: true, subtree: true });

  // --- GLOBAL VIDEO OBSERVER (RESTORED) ---
  const forceVideos = () => {
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src && img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '250px';
              video.style.width = 'auto';
              video.style.borderRadius = '10px';
              if (img.parentNode) {
                  img.parentNode.replaceChild(video, img);
              }
          }
      });
  };

  setInterval(forceVideos, 500);
  const vObserver = new MutationObserver(() => forceVideos());
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) vObserver.observe(chatContainer, { childList: true, subtree: true });
