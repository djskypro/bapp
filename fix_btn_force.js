const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove ALL existing submitLogin functions to stop conflicts
html = html.replace(/function submitLogin\(\) \{[\s\S]*?\n  \}/g, '');
html = html.replace(/function submitLogin\(\) \{[\s\S]*?\n\}/g, '');

// 2. Add the new bulletproof submitLogin + event listener at the end of the script
const fixJS = `
  // --- BULLETPROOF AUTH BUTTONS ---
  window.isLoginMode = false;

  window.submitLogin = function() {
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

      // Add loading spinner
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
  };

  window.toggleAuthMode = function() {
      window.isLoginMode = !window.isLoginMode;
      const btn = document.getElementById('login-submit-btn');
      btn.innerText = window.isLoginMode ? 'Login' : 'Create Account';
      document.getElementById('toggle-text').innerText = window.isLoginMode ? "Don't have an account?" : "Already have an account?";
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
  };

  // Attach listener directly to the button so onclick can't fail
  setTimeout(() => {
      const btn = document.getElementById('login-submit-btn');
      if (btn) {
          btn.onclick = null; // Remove old inline onclick
          btn.addEventListener('click', window.submitLogin);
      }
  }, 500);
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if (lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + fixJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Auth buttons forced with direct event listeners!');
} else {
    console.log('❌ Could not find script tag.');
}
