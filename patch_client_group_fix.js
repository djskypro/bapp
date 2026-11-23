const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We target the exact payload block from your terminal output
const oldPayload = `      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b'
      };`;

const newPayload = `      // --- CHECK IF IT'S A GROUP MESSAGE ---
      const isGroup = activeChatId.startsWith('group_');
      let groupMembers = [];
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
      }
      // --------------------------------------

      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b',
          isGroup: isGroup,
          groupMembers: groupMembers
      };`;

if (html.includes(oldPayload)) {
    html = html.replace(oldPayload, newPayload);
    fs.writeFileSync('index.html', html);
    console.log('✅ Client group payload fixed!');
} else {
    console.log('❌ Could not find the exact payload block.');
}
