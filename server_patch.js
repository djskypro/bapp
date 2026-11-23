const fs = require('fs');
let js = fs.readFileSync('server.js', 'utf8');

// Add handlers for typing and read receipts
const newLogic = `
        if (data.type === 'typing') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'typing', from: data.from, isTyping: data.isTyping }));
            }
        }

        if (data.type === 'read_receipt') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'read_receipt', from: data.from }));
            }
        }
`;

js = js.replace("if (data.type === 'send_message') {", newLogic + "\n        if (data.type === 'send_message') {");
fs.writeFileSync('server.js', js);
console.log('Server patched for typing and read receipts!');
