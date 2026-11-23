const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* --- FORCE PURE LIGHT MODE VARIABLES --- */
  body.light-mode {
    --bg: #ffffff !important;
    --text: #000000 !important;
    --text-muted: #666666 !important;
    --glass-bg: rgba(255, 255, 255, 0.9) !important;
    --glass-border: rgba(0, 0, 0, 0.1) !important;
    --search-bg: rgba(0, 0, 0, 0.05) !important;
    background-color: #ffffff !important;
    color: #000000 !important;
  }

  /* Force text elements to be black in light mode */
  body.light-mode .header h1,
  body.light-mode .chat-name,
  body.light-mode .chat-msg,
  body.light-mode #my-id,
  body.light-mode .search-box input,
  body.light-mode .nav-item,
  body.light-mode .messages .msg.received,
  body.light-mode .messages .msg.sent,
  body.light-mode .chat-header .name,
  body.light-mode .chat-header .lock {
    color: #000000 !important;
  }

  /* Fix the bottom nav and search bar backgrounds */
  body.light-mode .bottom-nav,
  body.light-mode .search-box,
  body.light-mode .chat-header,
  body.light-mode .chat-input-area {
    background: rgba(255, 255, 255, 0.8) !important;
    border-color: rgba(0, 0, 0, 0.1) !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
  }

  /* Invert the Snake Ball for Light Mode */
  body.light-mode #magic-ball {
    /* White sphere base with dark 3D shading */
    background: radial-gradient(circle at 30% 30%, #ffffff 0%, #d0d0d0 80%) !important;
    box-shadow: inset -20px -20px 50px rgba(0, 0, 0, 0.5), inset 10px 10px 30px rgba(255, 255, 255, 1) !important;
    opacity: 0.8;
  }

  body.light-mode #magic-ball::before {
    /* BLACK snake scales */
    background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(0, 0, 0, 0.15) 21%, rgba(0, 0, 0, 0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(0, 0, 0, 0.15) 21%, rgba(0, 0, 0, 0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(0, 0, 0, 0.15) 21%, rgba(0, 0, 0, 0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(0, 0, 0, 0.15) 21%, rgba(0, 0, 0, 0.15) 34%, transparent 35%, transparent) !important;
  }

  /* Make sure the chat view background is transparent so the ball shows */
  #chat-view {
    background: transparent !important;
  }
</style>
</head>
`;
html = html.replace('</head>', fixCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Light mode completely fixed with black textures!');
