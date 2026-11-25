const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldFunc = `function saveChat(id) {
    let chats = getChats();
    if (!chats.includes(id)) { chats.unshift(id); localStorage.setItem('bapp_chats', JSON.stringify(chats)); }
  }`;

const newFunc = `function saveChat(id) {
    let chats = getChats();
    // Remove the chat from its current position
    chats = chats.filter(c => c !== id);
    // Add it to the very top
    chats.unshift(id);
    // Save back to localStorage
    localStorage.setItem('bapp_chats', JSON.stringify(chats));
  }`;

if (html.includes(oldFunc)) {
    html = html.replace(oldFunc, newFunc);
    fs.writeFileSync('index.html', html);
    console.log("✅ Chat reordering fixed!");
} else {
    console.log("❌ Could not find the exact saveChat block.");
}
