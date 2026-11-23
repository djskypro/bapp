const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const liquidCSS = `
<style>
  /* --- LIQUID GLASS CHAT VIEW --- */
  
  /* Make the main chat background transparent so the dark ball shows */
  #chat-view {
    background: transparent !important;
  }

  /* 1. FLOATING HEADER */
  .chat-header {
    position: absolute !important;
    top: 15px !important;
    left: 15px !important;
    right: 15px !important;
    width: auto !important;
    z-index: 1000 !important;
    
    background: var(--glass-bg) !important;
    backdrop-filter: blur(30px) !important;
    -webkit-backdrop-filter: blur(30px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 25px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
    
    padding: 10px 15px !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Floating Back Button (Circle) */
  .chat-header .back-btn {
    background: var(--search-bg) !important;
    width: 38px !important;
    height: 38px !important;
    border-radius: 50% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin-right: 12px !important;
    border: 1px solid var(--glass-border) !important;
    color: var(--primary) !important;
  }

  /* 2. FLOATING INPUT AREA */
  .chat-input-area {
    position: absolute !important;
    bottom: max(15px, env(safe-area-inset-bottom)) !important;
    left: 15px !important;
    right: 15px !important;
    width: auto !important;
    z-index: 1000 !important;
    
    background: var(--glass-bg) !important;
    backdrop-filter: blur(30px) !important;
    -webkit-backdrop-filter: blur(30px) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 30px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
    
    padding: 8px 15px !important;
    border-top: none !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Adjust input field inside the glass pill */
  .chat-input-area input {
    background: transparent !important;
    padding: 10px 5px !important;
    color: var(--text) !important;
  }
  
  /* Style the send button to pop */
  .chat-input-area .send-btn {
    background: var(--primary) !important;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4) !important;
  }

  /* 3. MESSAGES SPACING */
  /* Push messages down so they don't hide behind the floating header */
  .messages {
    padding-top: 100px !important;
    padding-bottom: 110px !important;
  }
</style>
</head>
`;

html = html.replace('</head>', liquidCSS);
fs.writeFileSync('index.html', html);
console.log('✅ Liquid glass floating chat UI applied!');
