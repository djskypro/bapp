const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const authJS = `
  let isLoginMode = false;

  function toggleAuthMode() {
      isLoginMode = !isLoginMode;
      document.getElementById('login-submit-btn').innerText = isLoginMode ? 'Login' : 'Create Account';
      document.getElementById('toggle-text').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      checkPasswordStrength();
  }

  function checkPasswordStrength() {
      const pass = document.getElementById('login-password').value;
      const fill = document.getElementById('strength-fill');
      let score = 0;
      if (pass.length >= 8) score++;
      if (/[0-9]/.test(pass)) score++;
      if (/[^a-zA-Z0-9]/.test(pass)) score++;
      
      fill.style.width = (score / 3 * 100) + '%';
      fill.style.background = score === 1 ? '#e74c3c' : (score === 2 ? '#f1c40f' : '#2ecc71');
  }

  function submitLogin() {
      const uname = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();
      if (!uname || !pass) return alert("Enter username and password");
      
      if (!isLoginMode && pass.length < 8) return alert("Password must be 8+ characters");

      const payload = isLoginMode 
          ? { type: 'login_user', username: uname, password: pass }
          : { type: 'register_user', username: uname, password: pass, profile: { name: uname } };

      socket.send(JSON.stringify(payload));
  }

  // Listen for Auth responses from server
  socket.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      if (data.type === 'auth_success') {
          localStorage.setItem('bapp_username', data.username);
          localStorage.setItem('bapp_profile', JSON.stringify(data.profile || { name: data.username }));
          document.getElementById('login-screen').style.display = 'none';
          location.reload(); // Reload to start the app
      }
      if (data.type === 'auth_error') {
          alert("❌ " + data.message);
      }
  });
`;

// Inject right after the socket is created
html = html.replace("let socket = new WebSocket(", authJS + "\n  let socket = new WebSocket(");
fs.writeFileSync('index.html', html);
console.log('✅ Client Auth logic injected!');
