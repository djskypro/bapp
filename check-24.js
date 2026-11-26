
  let isScrolling = false;
  let scrollEndTimer = null;

  // We wait for the DOM to load
  document.addEventListener('DOMContentLoaded', () => {
    const msgBox = document.getElementById('chat-messages');
    if (msgBox) {
      msgBox.addEventListener('scroll', () => {
        // If the canvas animation function exists, we pause it (set a global flag)
        window.pauseBgAnimation = true;
        
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => {
          // When scrolling stops, resume the animation
          window.pauseBgAnimation = false;
        }, 150);
      });
    }
  });
