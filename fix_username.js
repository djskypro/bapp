const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force username at startup
const oldStart = `let myBappId = localStorage.getItem('bapp_username');`;
const newStart = `let myBappId = localStorage.getItem('bapp_username');
  while (!myBappId || myBappId.trim() === "" || myBappId === "null") {
      myBappId = prompt("Choose a username:");
      if (myBappId) myBappId = myBappId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
  localStorage.setItem('bapp_username', myBappId);`;

if (html.includes(oldStart)) {
    html = html.replace(oldStart, newStart);
}

fs.writeFileSync('index.html', html);
console.log('✅ Username forced at startup!');
