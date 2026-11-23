const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Send delivery confirmation)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the exact block that handles sending to an online user
const oldServerDelivery = `if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ 
                    type: 'new_message', 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false 
                }));
                console.log("✅ Delivered");`;

// Add the delivered_receipt line
const newServerDelivery = `if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({ 
                    type: 'new_message', 
                    from: from, 
                    text: text, 
                    isImage: isImage || false, 
                    isVoice: isVoice || false 
                }));
                // Send confirmation back to sender
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered (Receipt Sent)");`;

serverJs = serverJs.replace(oldServerDelivery, newServerDelivery);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. UPDATE CLIENT (Render double ticks on delivery)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Fix the checkmark rendering logic in appendMessage
const oldTickRender = `const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'read' ? '✓✓' : '✓';`;

const newTickRender = `const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';`;

html = html.replace(oldTickRender, newTickRender);

// B. Add the delivered_receipt listener in socket.onmessage
const oldSocketListen = `if (data.type === 'read_receipt') {`;

const newSocketListen = `if (data.type === 'delivered_receipt') {
        // 1. Update Local Storage
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.to)) || [];
        msgs.forEach(m => { 
            if(m.type === 'sent' && m.status === 'sent') m.status = 'delivered'; 
        });
        localStorage.setItem('bapp_msgs_' + data.to, JSON.stringify(msgs));
        
        // 2. Update the UI if we are inside the chat
        if (activeChatId === data.to) {
          const checks = document.querySelectorAll('.msg.sent .msg-status');
          checks.forEach(c => { 
              // Only change single gray ticks to double gray ticks
              if(!c.classList.contains('read') && c.innerText === '✓') {
                  c.innerText = '✓✓'; 
              }
          });
        }
      }

      if (data.type === 'read_receipt') {`;

html = html.replace(oldSocketListen, newSocketListen);

fs.writeFileSync('index.html', html);
console.log('✅ Delivery receipts and double gray ticks added perfectly!');
