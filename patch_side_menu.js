const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the bottom-sheet HTML with a side drawer
const oldMenuRegex = /<div id="chat-options-menu"[\s\S]*?<div class="glass"[\s\S]*?<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">/;
const newMenuStart = `
<div id="chat-options-menu" onclick="if(event.target===this) closeChatMenu()" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:99999; backdrop-filter: blur(5px);">
  <div class="glass" id="chat-menu-drawer" style="position:absolute; right:-300px; top:0; width:280px; height:100%; border-radius: 25px 0 0 25px; padding: 25px; display:flex; flex-direction:column; gap: 15px; transition: right 0.3s ease-out; box-shadow: -10px 0 30px rgba(0,0,0,0.5);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
`;
html = html.replace(oldMenuRegex, newMenuStart);

// 2. Update the open/close functions with slide animation
const oldOpenMenuRegex = /function openChatMenu\(\) \{[\s\S]*?\}/;
const newOpenMenu = `function openChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'block';
    // Slight delay to allow display:block to render before changing 'right'
    setTimeout(() => {
      document.getElementById('chat-menu-drawer').style.right = '0px';
    }, 10);
  }`;
html = html.replace(oldOpenMenuRegex, newOpenMenu);

const oldCloseMenuRegex = /function closeChatMenu\(\) \{[\s\S]*?\}/;
const newCloseMenu = `function closeChatMenu() {
    document.getElementById('chat-menu-drawer').style.right = '-300px';
    setTimeout(() => {
      document.getElementById('chat-options-menu').style.display = 'none';
    }, 300); // Wait for animation to finish
  }`;
html = html.replace(oldCloseMenuRegex, newCloseMenu);

fs.writeFileSync('index.html', html);
console.log("✅ Side menu drawer applied!");
