
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
