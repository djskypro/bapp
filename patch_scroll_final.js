const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const cleanLogic = `    // --- RESTORE SCROLL POSITION OR SCROLL TO BOTTOM ---
    if (msgBox) {
      const savedScroll = localStorage.getItem('bapp_scroll_' + id);
      if (savedScroll !== null) {
        // Instantly jump to the exact memory
        msgBox.scrollTop = parseInt(savedScroll);
      } else {
        // First time opening: go to bottom
        msgBox.scrollTop = msgBox.scrollHeight;
      }

      // Save position continuously as you scroll
      msgBox.onscroll = function() {
        localStorage.setItem('bapp_scroll_' + id, msgBox.scrollTop);
      };
    }
`;

// Insert at the exact location where we deleted the old block
// We find the line right before the deleted block to use as an anchor
const anchor = `    // FORCE HIDE REPLY BOX ON CHAT OPEN`;
// Actually, we deleted from 3214. Let's just inject it after loadChatList(); which was at the top of that block.
// Looking at the previous grep, we can use the line before the messy block.
// Let's find the exact spot:
const searchLine = `    const rpBox = document.getElementById('reply-preview');`;

// We will insert the clean logic right after the loadChatList(); call that is around line 3200.
// Actually, to be safe, let's insert it right before the line that says "let unreads = getUnreads();"
const insertBefore = `    let unreads = getUnreads();`;

if (html.includes(insertBefore)) {
    html = html.replace(insertBefore, cleanLogic + "\n" + insertBefore);
    fs.writeFileSync('index.html', html);
    console.log("✅ Clean scroll logic inserted safely!");
} else {
    console.log("❌ Could not find insertion point.");
}
