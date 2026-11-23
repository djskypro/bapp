const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldLog = `console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isGroup: \${isGroup}\`);`;
const newLog = `console.log(\`📩 Msg from [\${from}] to [\${cleanTo}] isGroup: \${isGroup} | Members: \${JSON.stringify(groupMembers)}\`);`;

if (serverJs.includes(oldLog)) {
    serverJs = serverJs.replace(oldLog, newLog);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Member logging added!');
} else {
    console.log('❌ Could not find log line.');
}
