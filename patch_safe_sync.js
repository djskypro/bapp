const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldGroupLogic = `        if (data.type === 'create_group') {
            const { groupId, groupName, members, creator } = data;
            members.forEach(member => {
                if (member !== creator) {
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members }));
                    }
                }
            });
        }`;

const newGroupLogic = `        if (data.type === 'create_group') {
            const { groupId, groupName, members, creator } = data;
            members.forEach(member => {
                if (member !== creator) {
                    const targetWs = bappUsers.get(member);
                    if (targetWs && targetWs.readyState === 1) {
                        // 1. Tell them the group exists
                        targetWs.send(JSON.stringify({ type: 'group_created', groupId, groupName, members }));
                        
                        // 2. Send them a normal message that looks like a welcome system text
                        targetWs.send(JSON.stringify({
                            type: 'new_message',
                            from: creator,
                            text: "👋 You were added to the group: " + groupName,
                            msgId: Date.now().toString(),
                            isGroup: true,
                            groupId: groupId,
                            groupMembers: members,
                            bubbleColor: '#005c4b'
                        }));
                    }
                }
            });
        }`;

if(serverJs.includes(oldGroupLogic)) {
    serverJs = serverJs.replace(oldGroupLogic, newGroupLogic);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server will now send the welcome message safely!');
} else {
    console.log('❌ Could not find the exact group logic in server.js');
}
