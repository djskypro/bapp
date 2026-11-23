const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlock = `    if (savedScroll !== null) {
      // Restore where the user left off
      setTimeout(() => {
        if(msgBox) msgBox.scrollTop = parseInt(savedScroll);
      }, 300);
    } else {`;

const newBlock = `    if (savedScroll !== null) {
      // Restore where the user left off (multiple times to fight image loading)
      const restoreScroll = () => {
        if(msgBox) msgBox.scrollTop = parseInt(savedScroll);
      };
      restoreScroll();
      setTimeout(restoreScroll, 100);
      setTimeout(restoreScroll, 300);
      setTimeout(restoreScroll, 600);
    } else {`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Scroll restore forced multiple times!");
} else {
    console.log("❌ Could not find the exact block.");
}
