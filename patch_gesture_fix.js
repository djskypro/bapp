const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old broken gesture code
const oldGestureStart = html.indexOf('  // --- IOS STYLE BACK GESTURE ---');
const oldGestureEnd = html.indexOf('</script>\n</body>');
if (oldGestureStart !== -1) {
    html = html.substring(0, oldGestureStart) + html.substring(oldGestureEnd);
}

// 2. Inject the bulletproof touch-based gesture code
const newGestureCode = `
<script>
  // --- IOS STYLE BACK GESTURE (TOUCH FIX) ---
  let touchStartX = 0;
  let touchStartY = 0;
  let isEdgeSwipe = false;
  let isSwipingBack = false;

  // Use passive: false so we can prevent the default browser back action
  document.addEventListener('touchstart', (e) => {
    // Ignore if we are interacting with a message bubble (for swipe-to-reply)
    if (e.target.closest('.msg')) return;
    
    // Check if the touch started within 60px of the left edge
    if (e.touches[0].clientX < 60) {
      touchStartX = e.touches[0].clientX;
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

    // If the user is moving mostly horizontally to the right
    if (deltaX > 10 && Math.abs(deltaY) < Math.abs(deltaX)) {
      isSwipingBack = true;
      
      // Prevent the browser from doing its own native back gesture
      if (e.cancelable) e.preventDefault(); 
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // User is scrolling up/down, cancel the edge swipe
      isEdgeSwipe = false;
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (!isEdgeSwipe) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    
    // If swiped right by more than 60px, trigger the back action
    if (isSwipingBack && deltaX > 60) {
      handleBackGesture();
    }
    
    isEdgeSwipe = false;
    isSwipingBack = false;
  });

  // Handle what "Back" means depending on where you are
  function handleBackGesture() {
    // 1. Close Full Screen Status Viewer
    const statusViewer = document.getElementById('status-viewer');
    if (statusViewer && statusViewer.style.display === 'flex') {
      closeStatusViewer();
      return;
    }

    // 2. Close Status Preview Modal
    const preview = document.getElementById('status-preview-modal');
    if (preview && preview.style.display === 'flex') {
      closePreview();
      return;
    }

    // 3. Close Context Menu (long press menu)
    const ctxMenu = document.getElementById('msg-context-menu');
    if (ctxMenu && ctxMenu.style.display === 'flex') {
      ctxMenu.style.display = 'none';
      return;
    }

    // 4. Go back from Contact Info
    if (document.getElementById('contact-info-view').classList.contains('active')) {
      closeContactInfo();
      return;
    }

    // 5. Go back from Settings
    if (document.getElementById('settings-view').classList.contains('active')) {
      goBack();
      return;
    }

    // 6. Go back from Chat
    if (document.getElementById('chat-view').classList.contains('active')) {
      goBack();
      return;
    }
    
    // 7. Go back from Updates to Chats
    if (document.getElementById('status-view').classList.contains('active')) {
      goBack();
      return;
    }
  }
</script>
</body>
`;

html = html.replace('</body>', newGestureCode);
fs.writeFileSync('index.html', html);
console.log('✅ Fixed iOS Back Gesture with touch events!');
