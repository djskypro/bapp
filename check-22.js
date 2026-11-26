
  function loadWallpaper() {
    const savedWallpaper = localStorage.getItem('bapp_wallpaper');
    if (savedWallpaper) {
      document.body.style.backgroundImage = 'url(' + savedWallpaper + ')';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
  }

  function uploadWallpaper(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result;
      localStorage.setItem('bapp_wallpaper', base64Image);
      document.body.style.backgroundImage = 'url(' + base64Image + ')';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      alert("Wallpaper updated!");
    };
    reader.readAsDataURL(file);
  }

  function resetWallpaper() {
    localStorage.removeItem('bapp_wallpaper');
    document.body.style.backgroundImage = 'radial-gradient(circle at 15% 50%, rgba(37, 211, 102, 0.1), transparent 50%), radial-gradient(circle at 85% 30%, rgba(0, 150, 255, 0.1), transparent 50%)';
    alert("Wallpaper reset to default!");
  }

  // Load wallpaper on startup
  document.addEventListener('DOMContentLoaded', loadWallpaper);
  // Also try immediately in case DOMContentLoaded already fired
  loadWallpaper();
