
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
    if (!window.isLoginMode && (pass.length < 8 || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass))) {
      alert("Password does not meet requirements."); return;
    }
    if (window.isLoginMode && pass.length === 0) {
      alert("Please enter your password."); return;
    }

    const authSocket = new WebSocket(
      (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host
    );

    window.authSocket = authSocket;

    authSocket.onopen = () => {
      authSocket.send(JSON.stringify({
        type: 'auth_request',
        username: user,
        password: pass,
        isLogin: window.isLoginMode
      }));
    };

    authSocket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (response.type === 'auth_success') {
        localStorage.setItem('bapp_username', response.username || user);
        localStorage.setItem('bapp_password', pass);
        localStorage.setItem('bapp_profile', JSON.stringify(response.profile || { name: user }));
        authSocket.close();
        window.location.reload();
      } else if (response.type === 'auth_error') {
        alert(response.message || 'Authentication failed.');
        authSocket.close();
      }
    };

    authSocket.onerror = () => {
      alert("Could not connect to the server. Please try again.");
    };
  }
