const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the hidden dots with the 3 horizontal lines (Hamburger icon)
const oldHiddenDots = '<span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer; opacity: 0; width: 20px;">⋮</span>';
const newHamburger = '<span onclick="openChatMenu()" style="cursor:pointer; font-size:20px; line-height:1;">☰</span>';
html = html.replace(oldHiddenDots, newHamburger);

// 2. Un-hide the dropdown menu we disabled earlier
html = html.replace('id="chat-options-menu" style="display:none !important;" onclick=', 'id="chat-options-menu" onclick=');

fs.writeFileSync('index.html', html);
console.log("✅ Hamburger menu added and enabled!");
