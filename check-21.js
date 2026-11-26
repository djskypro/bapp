
  function setGlobalPin() {
    const oldPin = localStorage.getItem('bapp_global_pin');
    const modal = document.getElementById('global-pin-modal');
    const oldInput = document.getElementById('old-pin-input');
    const newInput = document.getElementById('new-pin-input');
    const desc = document.getElementById('pin-modal-desc');
    
    modal.style.display = 'flex';
    newInput.value = '';
    
    if (oldPin) {
      oldInput.style.display = 'block';
      oldInput.value = '';
      desc.innerText = "Enter your current PIN to change it.";
    } else {
      oldInput.style.display = 'none';
      desc.innerText = "Set a secret code to unlock hidden chats.";
    }
  }

  function closeGlobalPinModal() {
    document.getElementById('global-pin-modal').style.display = 'none';
  }

  function saveGlobalPin() {
    const oldPin = localStorage.getItem('bapp_global_pin');
    const oldInput = document.getElementById('old-pin-input').value.trim();
    const newInput = document.getElementById('new-pin-input').value.trim();
    
    if (oldPin && oldInput !== oldPin) {
      alert("Incorrect current PIN!");
      return;
    }
    
    if (newInput.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    
    localStorage.setItem('bapp_global_pin', newInput);
    alert("PIN successfully updated to: " + newInput);
    closeGlobalPinModal();
  }
