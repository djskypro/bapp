const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the crash
html = html.replace(`document.getElementById('login-screen').style.display = 'flex';
      throw new Error("Auth required"); // Stop the rest of the script from running`, 
`document.getElementById('login-screen').style.display = 'flex';`);

// 2. Fix the infinite reload in socket.onopen
const oldOnOpen = `const savedPass = localStorage.getItem('bapp_password');
            if (savedPass) {
                socket.send(JSON.stringify({ type: 'auth_request', username: myBappId, password: savedPass, isLogin: true }));
            } else {
                localStorage.removeItem('bapp_username');
                window.location.reload();
            }`;

const newOnOpen = `const savedPass = localStorage.getItem('bapp_password');
            if (savedPass && myBappId) {
                socket.send(JSON.stringify({ type: 'auth_request', username: myBappId, password: savedPass, isLogin: true }));
            }`;
html = html.replace(oldOnOpen, newOnOpen);

// 3. Fix the reconnect block to use auth_request instead of register_user
const oldReconnect = `socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));`;
const newReconnect = `const savedPass = localStorage.getItem('bapp_password');
        if (savedPass && myBappId) {
            socket.send(JSON.stringify({ type: 'auth_request', username: myBappId, password: savedPass, isLogin: true }));
        }`;
html = html.replace(oldReconnect, newReconnect);

fs.writeFileSync('index.html', html);
console.log("✅ Login crash and infinite reload fixed!");
