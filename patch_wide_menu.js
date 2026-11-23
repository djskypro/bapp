const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const css = `
<style>
  /* Make the right island wider and push icons apart */
  .header-action-icons {
    padding: 0 20px !important;
    gap: 25px !important; /* Space between the video and 3 dots */
    min-width: 110px !important; /* Force it to be wider */
    justify-content: center !important;
  }

  /* Make the icons themselves bigger and easier to tap */
  .header-action-icons span {
    font-size: 22px !important;
    padding: 5px !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>`;
html = html.replace('</head>', css);
fs.writeFileSync('index.html', html);
console.log("✅ Right island widened!");
