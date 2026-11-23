const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldLoop = `    const chats = getChats();
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    chats.forEach(id => {
      if (hiddenChats[id]) return; // Skip hidden chats in normal search`;

const newLoop = `    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    // Loop through EVERYTHING in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith('bapp_msgs_')) continue;
      
      const id = key.replace('bapp_msgs_', '');
      if (hiddenChats[id]) continue; // Skip hidden chats`;

if (html.includes(oldLoop)) {
    html = html.replace(oldLoop, newLoop);
    
    // We also need to close the new for loop properly. The old loop ended with `});`, we need `}`
    // Let's find the end of the loop (just before `if (resultHTML !== '')`)
    const oldEnd = `        });
    });
    
    if (resultHTML !== '') {`;
    const newEnd = `        });
    }
    
    if (resultHTML !== '') {`;
    
    html = html.replace(oldEnd, newEnd);
    
    fs.writeFileSync('index.html', html);
    console.log("✅ Search now scans the entire app!");
} else {
    console.log("❌ Could not find the loop to replace.");
}
