const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const glassCSS = `
<style>
  /* ===== TRUE LIQUID GLASS ===== */
  
  /* 1. Message Bubbles */
  .msg.received, .msg.sent {
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      0 8px 20px rgba(0, 0, 0, 0.4) !important;
    color: #fff !important;
  }

  /* Tint sent messages slightly green to match theme */
  .msg.sent {
    background: rgba(37, 211, 102, 0.1) !important;
    border: 1px solid rgba(37, 211, 102, 0.3) !important;
  }

  /* 2. Input Area & Header Islands */
  .chat-input-area, .chat-header, .glass-island {
    background: rgba(20, 20, 20, 0.4) !important;
    backdrop-filter: blur(25px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(25px) saturate(200%) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.4) !important; /* Glossy top edge */
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.3),
      0 10px 30px rgba(0, 0, 0, 0.5) !important;
  }

  /* 3. The Text Input inside the glass */
  .chat-input-area input {
    background: rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
  }
</style>
</head>`;

html = html.replace('</head>', glassCSS);
fs.writeFileSync('index.html', html);
console.log("✅ Liquid Glass applied!");
