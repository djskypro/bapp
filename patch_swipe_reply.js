const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add CSS to make the swipe smooth and lock vertical scrolling
const swipeCSS = `
<style>
  .msg {
    transition: transform 0.2s ease-out;
    touch-action: pan-y; /* Allow vertical scrolling, capture horizontal */
  }
  .msg.swiping {
    transition: none; /* Instant follow while dragging */
  }
</style>
</head>
`;
html = html.replace('</head>', swipeCSS);

// 2. Replace the attachContextMenu function with the new Swipe Logic
const oldContextMenuStart = html.indexOf('function attachContextMenu(');
const oldContextMenuEnd = html.indexOf('function showContextMenu(');

const newContextLogic = `
  function attachContextMenu(el, msgId, text, isMe) {
    el.dataset.msgId = msgId;
    el.dataset.msgText = text;
    el.dataset.isMe = isMe;

    let startX = 0;
    let currentX = 0;
    let startY = 0;
    let isSwiping = false;
    let pressTimer;

    // --- POINTER DOWN ---
    el.addEventListener('pointerdown', (e) => {
      // Don't trigger swipe if tapping a button (like play audio)
      if (e.target.closest('.wa-play-btn') || e.target.tagName === 'AUDIO') return;

      startX = e.clientX;
      startY = e.clientY;
      isSwiping = false;
      el.classList.add('swiping');

      // Fallback: Long press still opens the menu for Delete/Copy
      pressTimer = setTimeout(() => {
        if (!isSwiping) showContextMenu(e.clientX, e.clientY, el);
      }, 600);
    });

    // --- POINTER MOVE ---
    el.addEventListener('pointermove', (e) => {
      if (startX === 0) return;
      
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;

      // If moving horizontally more than vertically, it's a swipe
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 10) {
        isSwiping = true;
        clearTimeout(pressTimer); // Cancel long press
        
        // Only allow swiping right (positive diffX) up to 80px
        if (diffX > 0 && diffX < 80) {
          el.style.transform = \`translateX(\${diffX}px)\`;
        }
      }
    });

    // --- POINTER UP ---
    el.addEventListener('pointerup', (e) => {
      clearTimeout(pressTimer);
      el.classList.remove('swiping');

      if (isSwiping) {
        const diffX = e.clientX - startX;
        
        // Snap back to original position
        el.style.transform = \`translateX(0px)\`;
        
        // If swiped far enough to the right, trigger reply
        if (diffX > 50) {
          activeMsgElement = el; // Set the global active element
          executeReply();
        }
        
        startX = 0; // Reset
      } else {
        el.style.transform = \`translateX(0px)\`;
        startX = 0;
      }
    });

    // --- POINTER CANCEL ---
    el.addEventListener('pointercancel', () => {
      clearTimeout(pressTimer);
      el.classList.remove('swiping');
      el.style.transform = \`translateX(0px)\`;
      startX = 0;
    });

    // --- RIGHT CLICK (Desktop fallback) ---
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, el);
    });
  }

  `;

html = html.substring(0, oldContextMenuStart) + newContextLogic + html.substring(oldContextMenuEnd);

fs.writeFileSync('index.html', html);
console.log('✅ Swipe-to-Reply added successfully!');
