const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* STOP THE DESKTOP BOUNCE AND ZOOM */
  html, body {
    position: fixed !important;
    overflow: hidden !important;
    width: 100vw !important;
    height: 100dvh !important;
    margin: 0;
    padding: 0;
    overscroll-behavior: none !important; /* Prevents pull-to-refresh */
    -webkit-user-select: none; /* Prevents text selection highlighting */
    user-select: none;
  }

  /* Allow vertical scrolling only inside the chat and lists */
  .messages, .chat-list, .status-list {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain !important; /* Stops the bounce at the top/bottom */
  }
  
  /* Prevent inputs from causing the whole page to zoom */
  input, textarea {
    font-size: 16px !important;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ UI locked! No more moving like desktop mode.');
