const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add a click listener to the document that hides the reply box if you click outside
const clickOutsideLogic = `
  document.addEventListener('click', function(event) {
    const replyArea = document.getElementById('msg-popup-reply-area');
    const popup = document.getElementById('msg-popup');
    const replyBtn = document.getElementById('popup-reply-btn');
    
    // If reply area is visible, and the click is not inside it, and not the reply button
    if (replyArea && replyArea.style.display === 'block') {
      if (!replyArea.contains(event.target) && event.target !== replyBtn && !replyBtn.contains(event.target)) {
        replyArea.style.display = 'none';
        // Reset the 5s timer so the popup doesn't vanish instantly while you're reading it
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
          popup.classList.remove('show');
        }, 5000);
      }
    }
  });
`;

// Inject this logic right before the end of the script block
html = html.replace('function openPopupChat()', clickOutsideLogic + '\n  function openPopupChat()');

fs.writeFileSync('index.html', html);
console.log("✅ Click-outside listener added!");
