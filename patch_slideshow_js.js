const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const slideshowJS = `
<script>
  let slideshowInterval = null;
  let slideshowImages = [];
  let slideshowIndex = 0;

  function uploadSlideshow(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    slideshowImages = [];
    let filesProcessed = 0;

    // Read all files and convert to base64
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function(e) {
        slideshowImages.push(e.target.result);
        filesProcessed++;
        
        // Once all files are loaded, save and start
        if (filesProcessed === files.length) {
          localStorage.setItem('bapp_slideshow', JSON.stringify(slideshowImages));
          alert("Slideshow set with " + slideshowImages.length + " images!");
          startSlideshow();
        }
      };
      reader.readAsDataURL(files[i]);
    }
  }

  function startSlideshow() {
    const saved = localStorage.getItem('bapp_slideshow');
    if (!saved) return;
    
    slideshowImages = JSON.parse(saved);
    if (slideshowImages.length === 0) return;

    // Clear any existing interval
    if (slideshowInterval) clearInterval(slideshowInterval);
    
    // Clear single wallpaper to avoid conflict
    localStorage.removeItem('bapp_wallpaper');
    document.body.style.backgroundImage = 'url(' + slideshowImages[0] + ')';
    slideshowIndex = 0;

    // Change wallpaper every 10 seconds (you can change 10000 to 3600000 for 1 hour)
    slideshowInterval = setInterval(() => {
      slideshowIndex = (slideshowIndex + 1) % slideshowImages.length;
      document.body.style.backgroundImage = 'url(' + slideshowImages[slideshowIndex] + ')';
    }, 10000); 
  }

  // Modify the original loadWallpaper to check for slideshow first
  const originalLoadWallpaper = loadWallpaper;
  loadWallpaper = function() {
    const savedSlideshow = localStorage.getItem('bapp_slideshow');
    if (savedSlideshow) {
      startSlideshow();
    } else if (originalLoadWallpaper) {
      originalLoadWallpaper();
    }
  };
</script>
`;
html = html.replace('</body>', slideshowJS + '</body>');
fs.writeFileSync('index.html', html);
console.log("✅ Slideshow logic added!");
