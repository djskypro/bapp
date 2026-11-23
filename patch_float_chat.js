const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Inject a new style block right before </head> to guarantee it overrides everything
const floatCSS = `
<style>
  /* 1. Make the Chat View background transparent so the background is visible */
  #chat-view {
    background: transparent !important;
  }

  /* 2. Floating Chat Header */
  .chat-header {
    position: absolute !important;
    top: 15px !important; 
    left: 15px !important; 
    right: 15px !important;
    width: auto !important;
    z-index: 1000 !important;
    border-radius: 20px !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(30px) !important;
    -webkit-backdrop-filter: blur(30px) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
    padding: 10px 15px !important;
    display: flex !important;
    align-items: center !important;
  }

  /* 3. Floating Back Button */
  .chat-header .back-btn {
    background: var(--search-bg) !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin-right: 10px !important;
    border: 1px solid var(--glass-border) !important;
  }

  /* 4. Floating Chat Input Area */
  .chat-input-area {
    position: absolute !important;
    bottom: 15px !important; 
    left: 15px !important; 
    right: 15px !important;
    width: auto !important;
    z-index: 1000 !important;
    border-radius: 30px !important;
    background: var(--glass-bg) !important;
    backdrop-filter: blur(30px) !important;
    -webkit-backdrop-filter: blur(30px) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
    padding: 8px 15px !important;
    border-top: none !important;
  }

  /* 5. Push messages down so they don't hide behind the header */
  .messages {
    padding-top: 100px !important;
    padding-bottom: 100px !important;
  }
  
  /* Adjust input inside the floating pill */
  .chat-input-area input {
    background: transparent !important;
    padding: 10px 5px !important;
  }
</style>
</head>
`;

// Replace the closing head tag with our new CSS + the closing head tag
html = html.replace('</head>', floatCSS);

fs.writeFileSync('index.html', html);
console.log('✅ Floating Glass Chat UI successfully forced!');
