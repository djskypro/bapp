
  function toggleDimWallpaper() {
    const toggle = document.getElementById('dim-wallpaper-toggle');
    if (toggle && toggle.checked) {
      localStorage.setItem('bapp_dim_wallpaper', 'true');
      document.body.classList.add('dimmed');
    } else {
      localStorage.setItem('bapp_dim_wallpaper', 'false');
      document.body.classList.remove('dimmed');
    }
  }

  // Load the setting when the app starts
  document.addEventListener('DOMContentLoaded', () => {
    const isDimmed = localStorage.getItem('bapp_dim_wallpaper') === 'true';
    const toggle = document.getElementById('dim-wallpaper-toggle');
    if (isDimmed) {
      if (toggle) toggle.checked = true;
      document.body.classList.add('dimmed');
    }
  });
