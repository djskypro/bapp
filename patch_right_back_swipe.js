const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const rightSwipeJS = `
<script>
  // --- RIGHT EDGE BACK GESTURE ---
  let touchStartX = 0;
  let touchStartY = 0;
  let isEdgeSwipe = false;
  let isSwipingBack = false;
  
  // Increase this number to make the edge easier to grab
  const EDGE_WIDTH = 50; 
  const SWIPE_THRESHOLD = 60;

  document.addEventListener('touchstart', (e) => {
    // Ignore if we are interacting with a message bubble
    if (e.target.closest('.msg')) return;
    
    const screenWidth = window.innerWidth;
    const touchX = e.touches[0].clientX;

    // Check if the touch started within EDGE_WIDTH of the RIGHT edge
    if (touchX > screenWidth - EDGE_WIDTH) {
      touchStartX = touchX;
      touchStartY = e.touches[0].clientY;
      isEdgeSwipe = true;
      isSwipingBack = false;
    } else {
      isEdgeSwipe = false;
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isEdgeSwipe) return;
    
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    // If moving mostly horizontally to the LEFT
    if (deltaX < -10 && Math.abs(deltaY) < Math.abs(deltaX)) {
      isSwipingBack = true;
      // Prevent the browser's default back gesture
      if (e.cancelable) e.preventDefault(); 
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isEdgeSwipe = false;
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (!isEdgeSwipe) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    
    // If swiped LEFT by more than the threshold, trigger the back action
    if (isSwipingBack && deltaX < -SWIPE_THRESHOLD) {
      handleBackGesture();
    }
    
    isEdgeSwipe = false;
    isSwipingBack = false;
  });

  function handleBackGesture() {
    // 1. Close Full Screen Status Viewer
    const statusViewer = document.getElementById('status-viewer');
    if (statusViewer && statusViewer.style.display === 'flex') {
      closeStatusViewer(); return;
    }
    // 2. Close Status Preview Modal
    const preview = document.getElementById('status-preview-modal');
    if (preview && preview.style.display === 'flex') {
      closePreview(); return;
    }
    // 3. Close Context Menu
    const ctxMenu = document.getElementById('msg-context-menu');
    if (ctxMenu && ctxMenu.style.display === 'flex') {
      ctxMenu.style.display = 'none'; return;
    }
    // 4. Go back from Contact Info
    if (document.getElementById('contact-info-view').classList.contains('active')) {
      closeContactInfo(); return;
    }
    // 5. Go back from Settings
    if (document.getElementById('settings-view').classList.contains('active')) {
      goBack(); return;
    }
    // 6. Go back from Chat
    if (document.getElementById('chat-view').classList.contains('active')) {
      goBack(); return;
    }
    // 7. Go back from Updates
    if (document.getElementById('status-view').classList.contains('active')) {
      goBack(); return;
    }
  }
</script>
</body>
`;

// Remove any previous left-swipe attempts to prevent conflicts
html = html.replace(/<script>\s*\/\/ --- IOS STYLE BACK GESTURE[\s\S]*?<\/script>\s*<\/body>/g, '');
html = html.replace(/<script>\s*\/\/ --- RIGHT EDGE BACK GESTURE[\s\S]*?<\/script>\s*<\/body>/g, '');

html = html.replace('</body>', rightSwipeJS);
fs.writeFileSync('index.html', html);
console.log('✅ Right-edge back swipe added successfully!');
