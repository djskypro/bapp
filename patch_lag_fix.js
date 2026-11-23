const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the scroll pause logic
const lagFixJS = `
<script>
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
</script>
`;
html = html.replace('</body>', lagFixJS + '</body>');

// 2. Slightly reduce the heavy blur on the bottom nav (line 65)
// Blurring 30px is too heavy for mobile. We'll drop it to 15px.
html = html.replace('backdrop-filter: blur(30px); border: 1px solid var(--glass-border); }', 'backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid var(--glass-border); }');

fs.writeFileSync('index.html', html);
console.log("✅ Lag fix applied! (Scroll pause & blur reduction)");
