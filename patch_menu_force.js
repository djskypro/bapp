const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the broken openChatMenu function entirely (using a regex that ignores whitespace)
const brokenFuncRegex = /function openChatMenu\(\) \{[\s\S]*?\}\s*\, 10\);\s*\}/;
html = html.replace(brokenFuncRegex, '');

// 2. Inject the fresh, working function right after <script>
const newFunc = `
  function openChatMenu() {
    const menu = document.getElementById('chat-options-menu');
    const drawer = document.getElementById('chat-menu-drawer');
    if(menu && drawer) {
      menu.style.display = 'block';
      setTimeout(() => {
        drawer.style.transform = 'scale(1) translateY(0)';
        drawer.style.opacity = '1';
      }, 10);
    }
  }

  function closeChatMenu() {
    const menu = document.getElementById('chat-options-menu');
    const drawer = document.getElementById('chat-menu-drawer');
    if(menu && drawer) {
      drawer.style.transform = 'scale(0.95) translateY(-10px)';
      drawer.style.opacity = '0';
      setTimeout(() => {
        menu.style.display = 'none';
      }, 200);
    }
  }
`;
// We inject it right before the first script tag to ensure it loads
html = html.replace('</head>', `<script>\n${newFunc}\n</script>\n</head>`);

fs.writeFileSync('index.html', html);
console.log("✅ Menu function forcefully rewritten!");
