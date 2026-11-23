const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the exact broken block from line 3216 to 3232
const oldLogicRegex = /const savedScroll = localStorage\.getItem\('bapp_scroll_' \+ id\);[\s\S]*?setTimeout\(scrollToBottom, 500\);\s*\}/;

const newLogic = `const savedScroll = localStorage.getItem('bapp_scroll_' + id);

    // Instantly apply the saved scroll position
    if (savedScroll !== null) {
      msgBox.scrollTop = parseInt(savedScroll);
    } else {
      // If no memory, just go to the bottom once
      msgBox.scrollTop = msgBox.scrollHeight;
    }

    // Save scroll position continuously as you scroll
    msgBox.onscroll = function() {
      localStorage.setItem('bapp_scroll_' + id, msgBox.scrollTop);
    };
  }`;

if (html.match(oldLogicRegex)) {
    html = html.replace(oldLogicRegex, newLogic);
    fs.writeFileSync('index.html', html);
    console.log("✅ Forced timers removed and scroll memory cleaned up!");
} else {
    console.log("❌ Could not find the exact block. The code might have changed.");
}
