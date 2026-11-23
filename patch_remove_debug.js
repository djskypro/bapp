const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove the debug console.logs from sendMessage
html = html.replace(`    console.log("GROUPS DB:", JSON.parse(localStorage.getItem('bapp_groups')));
    console.log("ACTIVE CHAT:", activeChatId);
    
`, '');

html = html.replace(`      console.log("GROUP DEBUG:", { activeChatId, isGroup, groupMembers });
      
`, '');

fs.writeFileSync('index.html', html);
console.log('✅ Debug logs removed!');
