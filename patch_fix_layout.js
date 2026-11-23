const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* 1. Fix the Chat View Height to fit the phone screen perfectly */
  #chat-view {
    height: 100dvh !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
  }

  /* 2. Push the input area up so it doesn't hit the Android nav bar */
  .chat-input-area {
    bottom: max(15px, env(safe-area-inset-bottom)) !important;
  }

  /* 3. Push the bottom nav up on the home screen */
  .bottom-nav {
    bottom: max(15px, env(safe-area-inset-bottom)) !important;
  }

  /* 4. Add enough padding to the bottom of the messages so the last message is never hidden */
  .messages {
    padding-bottom: 100px !important;
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Fixed chat layout, message cutoff, and nav bar positioning!');
