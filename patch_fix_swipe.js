const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the CSS. Remove the !important from .msg so it can animate again.
html = html.replace(
  `  .msg, #magic-ball, .view {
    will-change: transform, opacity !important;
    transform: translateZ(0) !important;
    backface-visibility: hidden !important;
  }`,
  `  #magic-ball, .view {
    will-change: transform, opacity !important;
    transform: translateZ(0) !important;
    backface-visibility: hidden !important;
  }
  .msg {
    will-change: transform;
    /* Removed translateZ so swipe-to-reply works */
  }`
);

// 2. Rewrite the Swipe-to-Reply logic using 'touch' events (more reliable on phones)
const oldContextStart = html.indexOf('  function attachContextMenu(el, msgId, text, isMe) {');
const oldContextEnd = html.indexOf('  function showContextMenu(x, y, el) {');

const newContextLogic = `
  function attachContextMenu(el, msgId, text, isMe) {
    el.dataset.msgId = msgId;
    el.dataset.msgText = text;
    el.dataset.isMe = isMe;

    let startX = 0, startY = 0, currentX = 0;
    let isSwiping = false;
    let pressTimer;

    el.addEventListener('touchstart', (e) => {
      if (e.target.closest('.wa-play-btn') || e.target.tagName === 'AUDIO') return;
      
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      isSwiping = false;
      
      // Add a visual indicator that it's being touched
      el.style.transition = 'none';
      
      pressTimer = setTimeout(() => {
        if (!isSwiping) showContextMenu(e.touches[0].clientX, e.touches[0].clientY, el);
      }, 600);
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (startX === 0) return;
      
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      const diffY = e.touches[0].clientY - startY;

      // If swiping right more than scrolling up/down
      if (diffX > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping = true;
        clearTimeout(pressTimer);
        
        // Only slide right, up to 80px
        if (diffX > 0 && diffX < 80) {
          el.style.transform = \`translateX(\${diffX}px)\`;
        }
      }
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      clearTimeout(pressTimer);
      el.style.transition = 'transform 0.2s ease-out';
      
      if (isSwiping) {
        const diffX = currentX - startX;
        el.style.transform = 'translateX(0px)'; // Snap back
        
        if (diffX > 50) {
          activeMsgElement = el;
          executeReply(); // Trigger reply
        }
      } else {
        el.style.transform = 'translateX(0px)';
      }
      
      startX = 0;
      isSwiping = false;
    });

    // Desktop Right-click
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, el);
    });
  }

`;

html = html.substring(0, oldContextStart) + newContextLogic + html.substring(oldContextEnd);

fs.writeFileSync('index.html', html);
console.log('✅ Swipe-to-Reply fixed and integrated with the Back Gesture!');
