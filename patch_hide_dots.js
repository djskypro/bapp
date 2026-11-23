const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the 3 dots text but keep the element taking up space
const oldDots = '<span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>';
const newDots = '<span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer; opacity: 0; width: 20px;">⋮</span>';
html = html.replace(oldDots, newDots);

// 2. Also hide the dropdown menu so it doesn't accidentally pop up
html = html.replace('id="chat-options-menu" onclick=', 'id="chat-options-menu" style="display:none !important;" onclick=');

fs.writeFileSync('index.html', html);
console.log("✅ 3 dots hidden, space preserved.");
