const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Backup first
fs.copyFileSync('index.html', 'index_backup_gesture.html');

// 2. Add the edge-swipe logic at the end of the script
const swipeJS = `
<script>
  // --- IOS STYLE BACK GESTURE ---
  let startX = 0;
  let startY = 0;
  let isEdgeSwipe = false;

  document.addEventListener('pointerdown', (e) => {
    // Only trigger if the swipe starts within 50px of the left edge
    if (e.clientX < 50) {
      startX = e.clientX;
      startY = e.clientY;
      isEdgeSwipe = true;
    } else {
      isEdgeSwipe = false;
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (!isEdgeSwipe) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // If the user is scrolling up/down, cancel the back gesture
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isEdgeSwipe = false;
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (!isEdgeSwipe) return;
    
    const deltaX = e.clientX - startX;
    
    // If swiped right by more than 80px, trigger the back action
    if (deltaX > 80) {
      handleBackGesture();
    }
    
    isEdgeSwipe = false;
  });

  // Handle what "Back" means depending on where you are
  function handleBackGesture() {
    // 1. Close Full Screen Status Viewer
    if (document.getElementById('status-viewer').style.display === 'flex') {
      closeStatusViewer();
      return;
    }

    // 2. Close Status Preview Modal
    if (document.getElementById('status-preview-modal').style.display === 'flex') {
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

html = html.replace('</body>', swipeJS);
fs.writeFileSync('index.html', html);
console.log('✅ iOS Back Gesture added successfully!');
