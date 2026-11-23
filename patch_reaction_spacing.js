const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the context menu to be wider so emojis have room
const menuCss = `
<style>
  #msg-context-menu {
    min-width: 280px !important;
    padding: 10px !important;
  }
  .reaction-emoji {
    font-size: 28px !important;
    padding: 8px 12px !important;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
    border-radius: 50%;
  }
  .reaction-emoji:active {
    transform: scale(1.4) !important;
    background: rgba(255,255,255,0.2) !important;
  }
</style>
</head>`;
if(!html.includes('.reaction-emoji {')) {
    html = html.replace('</head>', menuCss);
}

// 2. Update the emoji HTML to use the new class
const oldEmojiBar = /<span onclick="addReaction\('([^']+)'\)" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale\(1.3\)'" onmouseout="this.style.transform='scale\(1\)'">([^<]+)<\/span>/g;
const newEmojiBar = `<span class="reaction-emoji" onclick="addReaction('$1')">$2</span>`;
html = html.replace(oldEmojiBar, newEmojiBar);

fs.writeFileSync('index.html', html);
console.log("✅ Emoji spacing fixed!");
