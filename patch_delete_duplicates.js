const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rename the old function at line 5104
const oldPayload = `    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply
    };`;
const newPayload = `    const isGroup = activeChatId.startsWith('group_');
    let groupMembers = [];
    if (isGroup) {
        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
        if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
    }
    
    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply,
        isGroup: isGroup,
        groupMembers: groupMembers
    };`;

if (html.includes(oldPayload)) {
    html = html.replace(oldPayload, newPayload);
}

// 2. Also fix the one at line 4610
const oldLine = `      text: text,`;
// We can't replace all text: text because they are everywhere. 
// But we can find the exact payload at 4610
const oldBlock = `          type: 'send_message', to: to, from: myBappId, text: text,`;
const newBlock = `          type: 'send_message', to: to, from: myBappId, text: text, isGroup: activeChatId.startsWith('group_'), groupMembers: (function() { let g = JSON.parse(localStorage.getItem('bapp_groups')) || {}; return g[activeChatId] ? g[activeChatId].members : []; })(),`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
}

fs.writeFileSync('index.html', html);
console.log('✅ All duplicate sendMessage functions now send isGroup and groupMembers!');
