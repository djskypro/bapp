const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Loading Spinner CSS
const spinnerCSS = `
<style>
  .btn-loading {
    pointer-events: none;
    opacity: 0.8;
    position: relative;
    color: transparent !important;
  }
  .btn-loading::after {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    margin-top: -10px;
    margin-left: -10px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>`;
if (!html.includes('btn-loading')) {
    html = html.replace('</head>', spinnerCSS);
}

// 2. Fix the submitLogin function (add loading animation)
const oldSubmit = /function submitLogin\(\) \{[\s\S]*?socket\.send\(JSON\.stringify\(payload\)\);\s*\}/;
const newSubmit = `function submitLogin() {
    const uname = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    if (!uname || !pass) return alert("Enter username and password");
    if (!isLoginMode && pass.length < 8) return alert("Password must be 8+ characters");

    const btn = document.getElementById('login-submit-btn');
    btn.classList.add('btn-loading');
    btn.innerText = '';

    const payload = isLoginMode 
        ? { type: 'login_user', username: uname, password: pass }
        : { type: 'register_user', username: uname, password: pass, profile: { name: uname } };

    socket.send(JSON.stringify(payload));
}`;
html = html.replace(oldSubmit, newSubmit);

// 3. Remove the OLD submitLogin at line 8701
const startOld = html.indexOf("function submitLogin() {", html.indexOf("function submitLogin() {") + 10);
if (startOld !== -1) {
    // Find the next 'function' after it to cut it out
    const endOld = html.indexOf("function ", startOld + 10);
    if (endOld !== -1) {
        html = html.substring(0, startOld) + html.substring(endOld);
    }
}

// 4. Remove the loading state when auth_error comes back
const oldError = `if (data.type === 'auth_error') {
          alert("❌ " + data.message);
      }`;
const newError = `if (data.type === 'auth_error') {
          const btn = document.getElementById('login-submit-btn');
          if (btn) { btn.classList.remove('btn-loading'); btn.innerText = isLoginMode ? 'Login' : 'Create Account'; }
          alert("❌ " + data.message);
      }`;
html = html.replace(oldError, newError);

fs.writeFileSync('index.html', html);
console.log('✅ Auth buttons fixed + Loading spinner added!');
