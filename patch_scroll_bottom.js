const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the openChat function and inject the scroll logic at the end of it
const oldOpenChat = `let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
    localStorage.setItem('bapp_msgs_' + id, JSON.stringify(msgs));
    
    loadChatList();`;

const newOpenChat = `let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
    localStorage.setItem('bapp_msgs_' + id, JSON.stringify(msgs));
    
    loadChatList();

    // --- FORCE SCROLL TO BOTTOM (NEWEST MESSAGE) ---
    const scrollToBottom = () => {
        if(msgBox) msgBox.scrollTop = msgBox.scrollHeight;
    };
    
    // Fire multiple times to catch image loading delays
    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 200);
    setTimeout(scrollToBottom, 500);`;

if (html.includes(oldOpenChat)) {
    html = html.replace(oldOpenChat, newOpenChat);
    fs.writeFileSync('index.html', html);
    console.log('✅ Auto-scroll to unread/bottom message added!');
} else {
    console.log('❌ Could not find openChat logic. Aborting.');
}
