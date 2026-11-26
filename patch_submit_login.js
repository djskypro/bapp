const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldSubmit = /function submitLogin\(\) \{[\s\S]*?window\.location\.reload\(\);[^\}]*\}/;
const newSubmit = `function submitLogin() {
    const user = document.getElementById('login-username').value.trim().toLowerCase();
    const pass = document.getElementById('login-password').value;
    
    if (!user) { alert("Please enter a username"); return; }
    if (!window.isLoginMode && (pass.length < 8 || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass))) {
      alert("Password does not meet requirements."); return;
    }
    if (window.isLoginMode && pass.length === 0) {
      alert("Please enter your password."); return;
    }
    
    // Tell the server to check the password
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
            type: 'auth_request', 
            username: user, 
            password: pass, 
            isLogin: window.isLoginMode 
        }));
    } else {
        alert("Server not connected. Please try again.");
    }
  }`;
  
html = html.replace(oldSubmit, newSubmit);
fs.writeFileSync('index.html', html);
console.log("✅ submitLogin now sends to server!");
