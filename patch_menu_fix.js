const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix the syntax error in openChatMenu
const brokenFunction = `function openChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'block';
  }, 10);
  }`;

const fixedFunction = `function openChatMenu() {
    const menu = document.getElementById('chat-options-menu');
    const drawer = document.getElementById('chat-menu-drawer');
    menu.style.display = 'block';
    // Small animation to pop it in
    setTimeout(() => {
      drawer.style.transform = 'scale(1) translateY(0)';
      drawer.style.opacity = '1';
    }, 10);
  }`;

html = html.replace(brokenFunction, fixedFunction);

// Add CSS to the drawer for the smooth pop-in effect
html = html.replace('id="chat-menu-drawer" class="glass" style="', 'id="chat-menu-drawer" class="glass" style="transform: scale(0.95) translateY(-10px); opacity: 0; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); ');

fs.writeFileSync('index.html', html);
console.log("✅ Syntax error fixed and menu animation added!");
