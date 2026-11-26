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

    if (!/^[a-z0-9_]{2,24}$/.test(user)) {
      alert("Username must be 2-24 characters using letters, numbers or underscores.");
      return;
    }

    const oldUser = localStorage.getItem('bapp_username');
    if (oldUser !== user) {
      localStorage.setItem('bapp_profile', JSON.stringify({ name: user }));
    }

    localStorage.setItem('bapp_username', user);
    window.location.reload();
  }
</script>
