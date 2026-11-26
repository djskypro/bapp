
  // --- CUSTOM TOAST SYSTEM ---
  function showToast(message) {
    const toast = document.getElementById('glass-toast');
    toast.innerText = message;
    toast.classList.add('show');
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 30000);
  }

  // Override the default ugly alert globally!
  window.alert = function(msg) {
    showToast(msg);
  };

  // --- SIMULATED CALLING SYSTEM ---
  let callInterval = null;

  function startCall(type) {
    const name = document.getElementById('chat-name').textContent;
    const avatar = document.getElementById('chat-avatar').src;
    
    document.getElementById('call-name').innerText = name;
    document.getElementById('call-avatar').src = avatar;
    
    const status = document.getElementById('call-status');
    status.innerText = 'Calling...';
    status.style.color = '#aaa';
    status.style.animation = 'pulse 1.5s infinite alternate';
    
    document.getElementById('call-screen').style.display = 'flex';

    // Simulate connecting after 3 seconds
    clearTimeout(callInterval);
    callInterval = setTimeout(() => {
      status.innerText = 'Connected (00:01)';
      status.style.color = '#25D366';
      status.style.animation = 'none';
    }, 30000);
  }

  function endCall() {
    document.getElementById('call-screen').style.display = 'none';
    clearTimeout(callInterval);
  }
