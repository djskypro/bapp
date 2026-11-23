const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const fixCSS = `
<style>
  /* 1. FLOAT THE AI ORB HIGHER AND DETACH IT */
  #bapp-ai-orb {
    bottom: 160px !important; /* Lifted way above the input bar */
    right: 25px !important;   /* Floating on the right side */
  }

  /* 2. PUSH MESSAGES UP SO THEY DON'T HIDE BEHIND THE INPUT BAR */
  .messages, #chat-messages {
    padding-bottom: 140px !important; /* Stops the last message from hiding */
  }
</style>
</head>
`;

html = html.replace('</head>', fixCSS);
fs.writeFileSync('index.html', html);
console.log('✅ AI orb floated higher and messages padded safely!');
