
  // --- TAP OUTSIDE TO CLOSE SEARCH ---
  document.addEventListener('pointerdown', function(event) {
    const searchContainer = document.querySelector('.search-container');
    const dropdown = document.getElementById('search-dropdown');
    const blurOverlay = document.getElementById('search-blur-overlay');
    
    // If the dropdown is currently visible
    if (dropdown && dropdown.style.display === 'block') {
      // Check if the tap was OUTSIDE the search container
      if (searchContainer && !searchContainer.contains(event.target)) {
        
        // 1. Hide dropdown
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        
        // 2. Hide blur overlay
        if (blurOverlay) blurOverlay.style.display = 'none';
        
        // 3. Clear the input text
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        // 4. Hide the X button
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) clearBtn.style.display = 'none';
        
        // 5. Remove focus from the input (closes keyboard on phone)
        if (searchInput) searchInput.blur();
      }
    }
  });
