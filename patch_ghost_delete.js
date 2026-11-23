const fs = require('fs');

// ==========================================
// 1. PATCH SERVER
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add the ghost delete route
const ghostRoute = `
        if (data.type === 'ghost_delete') {
            const { to, from, msgId } = data;
            if (bappUsers.has(to)) {
                bappUsers.get(to).send(JSON.stringify({ type: 'ghost_deleted', msgId: msgId, from: from }));
            }
        }
`;
if(!serverJs.includes("data.type === 'ghost_delete'")) {
    serverJs = serverJs.replace("if (data.type === 'delete_message') {", ghostRoute + "\n        if (data.type === 'delete_message') {");
}
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH CLIENT
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Find the exact delete function from your app (executeDelete)
const oldDeleteFunc = `  function executeDelete() {
    const el = activeMsgElement;
    const msgId = el.dataset.msgId;
    const to = activeChatId;
    
    // Remove locally
    el.innerHTML = '<span class="msg-deleted">🚫 This message was deleted</span>';
    el.dataset.msgText = 'DELETED';
    el.style.background = 'var(--search-bg)';
    
    // Send to server
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'delete_message', to: to, from: myBappId, msgId: msgId }));
    }
    
    // Update local storage
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
    let mIndex = msgs.findIndex(m => m.msgId === msgId);
    if(mIndex > -1) {
      msgs[mIndex].text = 'DELETED';
      msgs[mIndex].isDeleted = true;
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(msgs));
    }
    
    document.getElementById('msg-context-menu').style.display = 'none';
  }`;

const newDeleteFunc = `  function executeDelete() {
    const el = activeMsgElement;
    const msgId = el.dataset.msgId;
    const to = activeChatId;
    
    // 1. GHOST DELETE LOCALLY (Instantly remove the bubble from screen)
    if (el) {
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200); 
    }
    
    // 2. Send to server to delete on the OTHER person's phone
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ghost_delete', to: to, from: myBappId, msgId: msgId }));
    }
    
    // 3. Remove from local storage so it never comes back on refresh
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
    msgs = msgs.filter(m => m.msgId !== msgId);
    localStorage.setItem('bapp_msgs_' + to, JSON.stringify(msgs));
    
    document.getElementById('msg-context-menu').style.display = 'none';
  }`;

if(html.includes(oldDeleteFunc)) {
    html = html.replace(oldDeleteFunc, newDeleteFunc);
} else {
    // Fallback if spacing is slightly different
    const regex = /function executeDelete\(\) \{[\s\S]*?document\.getElementById\('msg-context-menu'\)\.style\.display = 'none';\s*\}/;
    html = html.replace(regex, newDeleteFunc);
}

// B. Add the listener to catch the ghost delete on the receiver's phone
const oldSocketListener = `if (data.type === 'read_receipt') {`;

const newSocketListener = `if (data.type === 'ghost_deleted') {
        // 1. Remove from screen
        const msgToDelete = document.getElementById('msg-' + data.msgId);
        if (msgToDelete) {
            msgToDelete.style.transition = 'opacity 0.2s';
            msgToDelete.style.opacity = '0';
            setTimeout(() => msgToDelete.remove(), 200);
        }
        
        // 2. Remove from local memory
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
        msgs = msgs.filter(m => m.msgId !== data.msgId);
        localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(msgs));
        
        loadChatList(); // Update preview text
      }

      if (data.type === 'read_receipt') {`;

if(html.includes(oldSocketListener)) {
    html = html.replace(oldSocketListener, newSocketListener);
}

fs.writeFileSync('index.html', html);
console.log('✅ Ghost Delete activated! Messages will vanish without a trace.');
