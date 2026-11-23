const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the renderStatuses function
const oldRender = `    for (const user in userStatuses) {
      const latest = userStatuses[user][userStatuses[user].length - 1];
      const timeAgo = Math.round((Date.now() - latest.timestamp) / 60000) + " mins ago";
      
      container.innerHTML += \`
        <div class="wa-status-item" onclick='startViewing("\${user}")'>
          <div class="wa-status-ring">
            <img src="https://ui-avatars.com/api/?name=\${user.substring(0,2)}&background=random">
          </div>
          <div>
            <div class="wa-status-name">\${user}</div>
            <div class="wa-status-time">\${timeAgo}</div>
          </div>
        </div>
      \`;
    }`;

const newRender = `    // Get the saved profiles from the phone's memory
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    for (const user in userStatuses) {
      const latest = userStatuses[user][userStatuses[user].length - 1];
      const timeAgo = Math.round((Date.now() - latest.timestamp) / 60000) + " mins ago";
      
      // Get their real DP, or fallback to a generated one if they don't have one
      const userProfile = profiles[user] || {};
      const userDP = userProfile.avatar || \`https://ui-avatars.com/api/?name=\${user.substring(0,2)}&background=random\`;

      container.innerHTML += \`
        <div class="wa-status-item" onclick='startViewing("\${user}")'>
          <div class="wa-status-ring">
            <img src="\${userDP}">
          </div>
          <div>
            <div class="wa-status-name">\${user}</div>
            <div class="wa-status-time">\${timeAgo}</div>
          </div>
        </div>
      \`;
    }`;

html = html.replace(oldRender, newRender);
fs.writeFileSync('index.html', html);
console.log('✅ Status rings now show real Profile Pictures!');
