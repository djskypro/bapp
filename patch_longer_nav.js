const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* MAKE BOTTOM NAV A LITTLE LONGER */
  .bottom-nav {
    width: 90% !important; /* Increased from 85% */
    max-width: 400px !important; /* Increased from 320px */
    left: 50% !important;
    transform: translateX(-50%) !important; /* Keep perfectly centered */
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Bottom Nav widened to 400px max-width, still centered!');
