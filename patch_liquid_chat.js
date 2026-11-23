const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the Chat View CSS
const newChatCSS = `
  /* --- LIQUID GLASS CHAT UI --- */
  
  /* Make the main chat background transparent so the snake ball shows through */
  #chat-view {
    background: transparent !important;
  }

  /* Floating Header */
  .chat-header {
    position: absolute;
    top: 15px; left: 15px; right: 15px;
    z-index: 100;
    border-radius: 25px;
    background: var(--glass-bg);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    padding: 10px 15px;
  }

  /* Floating Back Button */
  .back-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--search-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 12px;
    font-size: 20px;
    color: var(--primary);
    border: 1px solid var(--glass-border);
  }

  /* Make sure messages scroll underneath the floating header and input */
  .messages {
    padding-top: 90px;
    padding-bottom: 100px;
  }

  /* Floating Input Area */
  .chat-input-area {
    position: absolute;
    bottom: 15px; left: 15px; right: 15px;
    z-index: 100;
    border-radius: 30px;
    background: var(--glass-bg);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid var(--glass-border);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    padding: 8px 15px;
    border-top: none;
  }

  /* Adjust input field and buttons inside the pill */
  .chat-input-area input {
    background: transparent;
    padding: 10px 5px;
  }
  .attach-btn {
    padding: 5px 10px 5px 0;
    font-size: 22px;
  }
  .send-btn {
    width: 40px; height: 40px;
  }
</style>
`;

html = html.replace('</style>', newChatCSS);

// 2. Ensure the HTML structure supports the absolute positioning
// The existing structure already has .chat-header, .messages, and .chat-input-area so we just needed the CSS!

fs.writeFileSync('index.html', html);
console.log('✅ Liquid Glass Chat UI applied!');
