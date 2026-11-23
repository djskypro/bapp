const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldLog = `      const payload = {
          type: 'send_message',`;
const newLog = `      console.log("GROUP DEBUG:", { activeChatId, isGroup, groupMembers });
      
      const payload = {
          type: 'send_message',`;

html = html.replace(oldLog, newLog);
fs.writeFileSync('index.html', html);
console.log('✅ Debug log added!');
