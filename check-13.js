
  // Screenshot detection (Flashing screen black)
  document.addEventListener('keyup', function(e) {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText(''); // Clear clipboard
      const overlay = document.getElementById('panic-overlay');
      overlay.style.display = 'flex';
      setTimeout(() => overlay.style.display = 'none', 2000);
    }
  });
