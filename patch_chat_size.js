const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const sizeCSS = `
<style>
  /* 1. Constrain Images so they don't take up the whole screen */
  .msg img {
    max-width: 220px !important;
    max-height: 260px !important;
    border-radius: 10px !important;
    object-fit: cover !important;
    margin-bottom: 5px !important;
    display: block !important;
    cursor: pointer !important;
  }

  /* 2. Give text messages a bit more width */
  .msg {
    max-width: 85% !important;
    padding: 8px 12px !important;
    font-size: 15px !important;
  }

  /* 3. Tighten up the message container to give it more room */
  .messages {
    padding-left: 10px !important;
    padding-right: 10px !important;
    gap: 8px !important; /* Slightly closer messages */
  }
</style>
</head>
`;

html = html.replace('</head>', sizeCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Chat size and image constraints optimized!');
