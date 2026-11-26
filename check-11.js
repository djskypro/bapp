
  // Global listener for clicking quotes
  document.addEventListener('click', function(e) {
    const quote = e.target.closest('.quoted-msg');
    if (quote) {
      // Find the ID of the message that contains this quote
      const parentMsg = quote.closest('.msg');
      if (parentMsg && parentMsg.id) {
        const msgId = parentMsg.id.replace('msg-', '');
        
        // Find the original message being replied to
        const originalMsg = document.getElementById('msg-' + msgId);
        
        // If it exists on screen, scroll to it
        if (originalMsg) {
          originalMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
          originalMsg.classList.add('highlight-flash');
          setTimeout(() => originalMsg.classList.remove('highlight-flash'), 2000);
        } else {
          console.log("Original message not found on screen.");
        }
      }
    }
  });
