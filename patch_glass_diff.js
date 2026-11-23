const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove the previous glass block so we can replace it cleanly
const oldGlassRegex = /<style>\s*\/\* ===== TRUE LIQUID GLASS =====[\s\S]*?<\/style>\s*<\/head>/;
html = html.replace(oldGlassRegex, '</head>');

const newGlassCSS = `
<style>
  /* ===== TRUE LIQUID GLASS (DIFFERENTIATED) ===== */
  
  /* Base for both */
  .msg.received, .msg.sent {
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border-radius: 18px !important;
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2),
      0 8px 20px rgba(0, 0, 0, 0.4) !important;
    color: #fff !important;
    padding: 10px 15px !important;
  }

  /* RECEIVED: Frosted clear/grey glass */
  .msg.received {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.4) !important;
  }

  /* SENT: Green tinted glass */
  .msg.sent {
    background: rgba(37, 211, 102, 0.15) !important; /* Slightly stronger green */
    border: 1px solid rgba(37, 211, 102, 0.4) !important;
    border-top: 1px solid rgba(100, 255, 150, 0.5) !important;
  }

  /* Text color adjustments to make sure it pops */
  .msg.received { color: rgba(255, 255, 255, 0.9) !important; }
  .msg.sent { color: #ffffff !important; }

  /* 2. Input Area & Header Islands */
  .chat-input-area, .chat-header, .glass-island {
    background: rgba(20, 20, 20, 0.4) !important;
    backdrop-filter: blur(25px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(25px) saturate(200%) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.4) !important;
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

html = html.replace('</head>', newGlassCSS);
fs.writeFileSync('index.html', html);
console.log("✅ Glass colors differentiated!");
