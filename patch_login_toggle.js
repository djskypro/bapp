const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a toggle link at the bottom of the login box
const oldBtn = `<button class="login-btn" id="login-submit-btn" onclick="submitLogin()">Create Account</button>`;
const newBtn = `<button class="login-btn" id="login-submit-btn" onclick="submitLogin()">Create Account</button>
    
    <div style="text-align: center; font-size: 13px; color: #aaa; margin-top: 10px;">
      <span id="toggle-text">Already have an account?</span> 
      <span onclick="toggleAuthMode()" style="color: var(--primary); font-weight: bold; cursor: pointer;">Login</span>
    </div>`;
html = html.replace(oldBtn, newBtn);

// 2. Add the toggle logic
const toggleJS = `
<script>
  window.isLoginMode = false;

  function toggleAuthMode() {
    window.isLoginMode = !window.isLoginMode;
    
    const title = document.querySelector('#login-screen h2');
    const subtitle = document.querySelector('#login-screen p');
    const btn = document.getElementById('login-submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = toggleText.nextElementSibling;
    const reqList = document.querySelector('.req-list');
    const strengthBar = document.querySelector('.strength-bar');

    if (window.isLoginMode) {
      title.innerText = "Welcome Back";
      subtitle.innerText = "Login to your account";
      btn.innerText = "Login";
      toggleText.innerText = "Don't have an account?";
      toggleLink.innerText = "Sign Up";
      reqList.style.display = 'none'; // Hide password rules on login
      strengthBar.style.display = 'none';
    } else {
      title.innerText = "Welcome to BAPP";
      subtitle.innerText = "Create your secure account";
      btn.innerText = "Create Account";
      toggleText.innerText = "Already have an account?";
      toggleLink.innerText = "Login";
      reqList.style.display = 'flex';
      strengthBar.style.display = 'block';
    }
  }
</script>
`;
html = html.replace('</body>', toggleJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ UI Toggle added!");
