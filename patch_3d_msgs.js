const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newCSS = `
<style>
  /* --- 3D PHYSICAL MESSAGE BUBBLES --- */
  
  .msg {
    transition: transform 0.15s ease, box-shadow 0.15s ease !important;
    transform-origin: center;
  }

  /* Sent Messages (Green) */
  .msg.sent {
    border-top: 2px solid rgba(255, 255, 255, 0.4) !important;
    border-bottom: 3px solid rgba(0, 0, 0, 0.4) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-right: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow: 
      inset 0 1px 5px rgba(255, 255, 255, 0.1),
      0 8px 15px rgba(0, 0, 0, 0.3) !important;
  }

  /* Received Messages (Grey) */
  .msg.received {
    border-top: 2px solid rgba(255, 255, 255, 0.2) !important;
    border-bottom: 3px solid rgba(0, 0, 0, 0.6) !important;
    border-left: 1px solid rgba(0, 0, 0, 0.2) !important;
    border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
    box-shadow: 
      inset 0 1px 5px rgba(255, 255, 255, 0.05),
      0 8px 15px rgba(0, 0, 0, 0.4) !important;
  }

  /* Press effect (makes it feel like a physical button) */
  .msg:active {
    transform: scale(0.96) translateY(2px) !important;
    box-shadow: 
      inset 0 2px 8px rgba(0, 0, 0, 0.5),
      0 2px 5px rgba(0, 0, 0, 0.2) !important;
  }
</style>
</head>
`;

html = html.replace('</head>', newCSS);
fs.writeFileSync('index.html', html);
console.log('✅ 3D Message Bubbles applied!');
