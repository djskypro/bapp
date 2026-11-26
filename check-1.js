

  // --- GHOST MODE LOGIC ---
  
  window.ghostMode = localStorage.getItem('bapp_ghost_mode') === 'true';
  
  function toggleGhostMode() {
    const toggle = document.getElementById('ghost-mode-toggle');
    window.ghostMode = toggle ? toggle.checked : !window.ghostMode;
    localStorage.setItem('bapp_ghost_mode', window.ghostMode);
  }
  
  // Sync checkbox on load
  setTimeout(() => {
    const toggle = document.getElementById('ghost-mode-toggle');
    if (toggle) toggle.checked = window.ghostMode;
  }, 1000);
 // Init UI on load

  function safeSendReceipt(toId) {
    if (window.ghostMode) {
      console.log('👻 Ghost Mode: Read receipt blocked.');
      return;
    }
    socket.send(JSON.stringify({ type: 'read_receipt', to: toId, from: myBappId }));
  }

