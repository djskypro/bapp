const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const css = `
<style>
  /* GLOWING ONLINE RING */
  .avatar-wrapper {
    position: relative;
    display: inline-block;
  }
  .online-ring {
    position: absolute;
    top: -4px; left: -4px; right: -4px; bottom: -4px;
    border-radius: 50%;
    border: 2px solid #25D366;
    box-shadow: 0 0 10px #25D366, inset 0 0 10px #25D366;
    animation: pulse-ring 2s infinite;
    pointer-events: none;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
  }
</style>
</head>`;
html = html.replace('</head>', css);
fs.writeFileSync('index.html', html);
console.log("✅ CSS for glowing ring added!");
