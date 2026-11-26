const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the current submitLogin function entirely
const oldStart = html.indexOf('  function submitLogin() {');
const oldEnd = html.indexOf('  }', html.indexOf('socket.send(JSON.stringify(payload));', oldStart)) + 3;

if (oldStart !== -1 && oldEnd !== -1) {
    const newFunc = `  window.submitLogin = function() {
      const uname = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();
      const btn = document.getElementById('login-submit-btn');

      if (!uname || !pass) {
          alert("Please fill in both username and password.");
          return;
      }
      if (!window.isLoginMode && pass.length < 8) {
          alert("Password must be at least 8 characters.");
          return;
      }

      btn.classList.add('btn-loading');
      btn.innerText = '';

      const payload = window.isLoginMode 
          ? { type: 'login_user', username: uname, password: pass }
          : { type: 'register_user', username: uname, password: pass, profile: { name: uname } };

      if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(payload));
      } else {
          alert("Not connected to server. Please refresh.");
          btn.classList.remove('btn-loading');
          btn.innerText = window.isLoginMode ? 'Login' : 'Create Account';
      }
  };`;

    html = html.substring(0, oldStart) + newFunc + html.substring(oldEnd);
    fs.writeFileSync('index.html', html);
    console.log('✅ submitLogin fixed and attached to window!');
} else {
    console.log('❌ Could not find the submitLogin function boundaries.');
}
