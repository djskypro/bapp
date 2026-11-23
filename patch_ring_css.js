const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove the old ugly ring CSS
const oldCSS = /\/\* GLOWING ONLINE RING \*\/[\s\S]*?<\/style>/;
const newCSS = `/* GLOWING ONLINE RING */
  .avatar-wrapper {
    position: relative;
    display: inline-block;
    margin-right: 15px;
  }
  .avatar-wrapper .avatar {
    margin-right: 0; /* Fix spacing */
  }
  .online-ring {
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border-radius: 50%;
    border: 1.5px solid #25D366;
    box-shadow: 0 0 8px rgba(37, 211, 102, 0.6);
    animation: pulse-ring 2s infinite;
    pointer-events: none;
    display: none; /* Hide by default */
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(37, 211, 102, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
  }
</style>`;
html = html.replace(oldCSS, newCSS);

fs.writeFileSync('index.html', html);
console.log("✅ Ring CSS beautified!");
