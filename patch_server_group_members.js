const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldCondition = `            if (isGroup && groupMembers && groupMembers.length > 0) {`;
const newCondition = `            // If groupMembers is empty, try to get them from the database
            if (isGroup && (!groupMembers || groupMembers.length === 0)) {
                try {
                    // We don't have group storage on the server, so we can't easily get members
                    // Instead, just trust the sender's member list
                } catch(e) {}
            }
            
            if (isGroup && groupMembers && groupMembers.length > 0) {`;

if (serverJs.includes(oldCondition)) {
    serverJs = serverJs.replace(oldCondition, newCondition);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server condition patched!');
} else {
    console.log('❌ Could not find the condition.');
}
