const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldAvatar = `          <img src="\${avatarUrl}" class="avatar">`;
const newAvatar = `          <div class="avatar-wrapper">
            <img src="\${avatarUrl}" class="avatar">
            <div class="online-ring"></div>
          </div>`;

if (html.includes(oldAvatar)) {
    html = html.replace(oldAvatar, newAvatar);
    fs.writeFileSync('index.html', html);
    console.log("✅ Online Ring added to chat list avatars!");
} else {
    console.log("❌ Could not find the exact avatar line.");
}
