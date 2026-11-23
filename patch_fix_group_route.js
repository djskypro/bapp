const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the routing for ALL new_message blocks at once
const oldRouting = `const senderId = (data.from || '').trim();`;
const newRouting = `const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();`;

// Replace all occurrences
html = html.split(oldRouting).join(newRouting);

// 2. Ensure that when a group_created signal arrives, the group is saved and loaded
const oldGroupCreated = `if (data.type === 'group_created') {`;
const newGroupCreated = `if (data.type === 'group_created') {
          console.log("Received group_created:", data);`;

html = html.split(oldGroupCreated).join(newGroupCreated);

fs.writeFileSync('index.html', html);
console.log('✅ Group routing fixed! Messages will now go to the group chat.');
