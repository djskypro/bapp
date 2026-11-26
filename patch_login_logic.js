const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldPrompt = `let myBappId = localStorage.getItem('bapp_username');
  while (!myBappId || myBappId.trim() === "" || myBappId === "null") {
      myBappId = prompt("Choose a username:");
      if (myBappId) myBappId = myBappId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
  localStorage.setItem('bapp_username', myBappId);
  if (!myBappId) {
    myBappId = prompt("Welcome to BAPP! Choose a unique username:");
    while(!myBappId || myBappId.trim() === "") { myBappId = prompt("Username cannot be empty. Choose a username:"); }
    myBappId = myBappId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    localStorage.setItem('bapp_username', myBappId);
  }`;

const newLogic = `let myBappId = localStorage.getItem('bapp_username');
  if (!myBappId || myBappId.trim() === "" || myBappId === "null") {
      document.getElementById('login-screen').style.display = 'flex';
      throw new Error("Auth required"); // Stop the rest of the script from running
  }`;

if (html.includes(oldPrompt)) {
    html = html.replace(oldPrompt, newLogic);
    fs.writeFileSync('index.html', html);
    console.log("✅ Login logic activated!");
} else {
    console.log("❌ Could not find the exact prompt block.");
}
