const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the CSS
const loginCSS = `
<style>
  #login-screen {
    display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(10,10,10,0.95); backdrop-filter: blur(25px); z-index: 99999999;
    flex-direction: column; justify-content: center; align-items: center; padding: 20px;
  }
  .login-box {
    width: 100%; max-width: 350px; background: rgba(25,25,25,0.9);
    border: 1px solid rgba(255,255,255,0.15); border-radius: 25px; padding: 25px;
    display: flex; flex-direction: column; gap: 15px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }
  .login-input {
    width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
    padding: 15px; border-radius: 15px; color: white; outline: none; font-size: 16px;
  }
  .req-list { font-size: 12px; color: #888; display: flex; flex-direction: column; gap: 5px; margin-top: -5px; }
  .req-item { display: flex; align-items: center; gap: 5px; }
  .req-item.valid { color: #25D366; }
  .strength-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .strength-fill { height: 100%; width: 0%; transition: 0.3s; border-radius: 3px; }
  .login-btn {
    background: var(--primary); color: black; font-weight: bold; padding: 15px;
    border: none; border-radius: 15px; font-size: 16px; cursor: pointer; margin-top: 10px;
  }
</style>
</head>`;
html = html.replace('</head>', loginCSS);

// 2. Add the HTML
const loginHTML = `
<!-- SECURE LOGIN SCREEN -->
<div id="login-screen">
  <div class="login-box">
    <h2 style="color: var(--primary); text-align: center; margin: 0;">Welcome to BAPP</h2>
    <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 0;">Create your secure account</p>
    
    <input type="text" id="login-username" class="login-input" placeholder="Username" autocomplete="off">
    <input type="password" id="login-password" class="login-input" placeholder="Password" oninput="checkPasswordStrength()">
    
    <div class="strength-bar"><div class="strength-fill" id="strength-fill"></div></div>
    
    <div class="req-list">
      <div class="req-item" id="req-length">⚪ At least 8 characters</div>
      <div class="req-item" id="req-number">⚪ At least 1 number</div>
      <div class="req-item" id="req-symbol">⚪ At least 1 symbol (!@#$%)</div>
    </div>

    <button class="login-btn" id="login-submit-btn" onclick="submitLogin()">Create Account</button>
  </div>
</div>
`;
html = html.replace('<body>', '<body>\n' + loginHTML);

// 3. Add the Password Strength Logic
const loginJS = `
<script>
  function checkPasswordStrength() {
    const pass = document.getElementById('login-password').value;
    
    const hasLength = pass.length >= 8;
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);
    
    document.getElementById('req-length').className = 'req-item ' + (hasLength ? 'valid' : '');
    document.getElementById('req-length').innerText = (hasLength ? '🟢' : '⚪') + ' At least 8 characters';
    
    document.getElementById('req-number').className = 'req-item ' + (hasNumber ? 'valid' : '');
    document.getElementById('req-number').innerText = (hasNumber ? '🟢' : '⚪') + ' At least 1 number';
    
    document.getElementById('req-symbol').className = 'req-item ' + (hasSymbol ? 'valid' : '');
    document.getElementById('req-symbol').innerText = (hasSymbol ? '🟢' : '⚪') + ' At least 1 symbol';
    
    const fill = document.getElementById('strength-fill');
    let score = (hasLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
    
    if (score === 0) { fill.style.width = '0%'; }
    else if (score === 1) { fill.style.width = '33%'; fill.style.background = 'red'; }
    else if (score === 2) { fill.style.width = '66%'; fill.style.background = 'orange'; }
    else { fill.style.width = '100%'; fill.style.background = '#25D366'; }
  }

  function submitLogin() {
    const user = document.getElementById('login-username').value.trim().toLowerCase();
    const pass = document.getElementById('login-password').value;
    
    if (!user) { alert("Please enter a username"); return; }
    if (pass.length < 8 || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass)) {
      alert("Password does not meet requirements."); return;
    }
    
    localStorage.setItem('bapp_username', user);
    localStorage.setItem('bapp_password', pass); // Save password for future login
    window.location.reload(); // Reload to start the app
  }
</script>
</body>`;
html = html.replace('</body>', loginJS);

fs.writeFileSync('index.html', html);
console.log("✅ Beautiful Login UI added!");
