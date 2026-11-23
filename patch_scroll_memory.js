const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `    // --- FORCE SCROLL TO BOTTOM (NEWEST MESSAGE) ---
    const scrollToBottom = () => {
        if(msgBox) msgBox.scrollTop = msgBox.scrollHeight;
    };
    
    // Fire multiple times to catch image loading delays
    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
    setTimeout(scrollToBottom, 500);
    // Keyboard auto-focus removed
  }`;

const newBlock = `    // --- RESTORE SCROLL POSITION OR SCROLL TO BOTTOM ---
    const savedScroll = localStorage.getItem('bapp_scroll_' + id);
    
    if (savedScroll !== null) {
      // Restore where the user left off
      setTimeout(() => {
        if(msgBox) msgBox.scrollTop = parseInt(savedScroll);
      }, 50);
    } else {
      // First time opening this chat, scroll to bottom
      const scrollToBottom = () => {
          if(msgBox) msgBox.scrollTop = msgBox.scrollHeight;
      };
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
    }

    // Save scroll position continuously
    if (msgBox) {
      msgBox.onscroll = function() {
        localStorage.setItem('bapp_scroll_' + id, msgBox.scrollTop);
      };
    }
  }`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Scroll memory added and forced scroll removed!");
} else {
    console.log("❌ Could not find the exact block.");
}
