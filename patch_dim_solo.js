const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the CSS for the dimmed state
const css = `
<style>
  body.dimmed::before {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.6); /* Dark overlay */
    z-index: 1; /* Sits above the background, below the UI */
    pointer-events: none; /* Lets you click through it */
  }
</style>
</head>`;
html = html.replace('</head>', css);

// 2. Add the JS logic to toggle the class
const dimJS = `
<script>
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
</script>
`;
html = html.replace('</body>', dimJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Dim Wallpaper added cleanly!");
