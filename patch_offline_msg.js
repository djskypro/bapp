const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the socket.onmessage block and add the offline_messages handler
const oldSocketHandler = `if (data.type === 'new_message') {`;

const newSocketHandler = `if (data.type === 'offline_messages') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          // 1. Save to local storage
          try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            savedMsgs.push({ text: msg.text, type: 'received', time: now, isImage: msg.isImage });
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e) {}
          
          // 2. Save to chat list
          saveChat(senderId);
          
          // 3. Update UI
          if (activeChatId === senderId) {
            appendMessage(msg.text, 'received', now, '', msg.isImage);
          } else {
            let unreads = getUnreads();
            unreads[senderId] = (unreads[senderId] || 0) + 1;
            localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
          }
        });
        
        loadChatList(); // Refresh the list
      }

      if (data.type === 'new_message') {`;

if (html.includes(oldSocketHandler)) {
    html = html.replace(oldSocketHandler, newSocketHandler);
    fs.writeFileSync('index.html', html);
    console.log('✅ Offline messages listener added!');
} else {
    console.log('❌ Could not find the socket handler. Aborting.');
}
