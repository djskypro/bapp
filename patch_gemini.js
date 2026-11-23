const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Gemini Glow CSS
const geminiCSS = `
  /* GEMINI STARDUST GLOW */
  .chat-input-area {
    padding: 10px 15px 25px 15px;
    display: flex;
    gap: 10px;
    background: transparent; /* Make background transparent */
    border-top: none;
    position: relative;
    z-index: 10;
  }

  .input-glow-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: rgba(20, 20, 25, 0.9);
    border-radius: 25px;
    position: relative;
    padding: 2px 15px;
    box-shadow: 0 0 15px rgba(0, 150, 255, 0.15);
  }

  /* The Stardust Texture */
  .input-glow-wrapper::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 27px;
    background: 
      radial-gradient(circle at 10% 50%, rgba(37, 211, 102, 0.5) 0%, transparent 25%),
      radial-gradient(circle at 90% 50%, rgba(0, 150, 255, 0.5) 0%, transparent 25%),
      radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 6px 6px;
    z-index: -1;
    animation: geminiPulse 4s infinite alternate;
  }

  @keyframes geminiPulse {
    0% { opacity: 0.5; filter: blur(1px); }
    100% { opacity: 1; filter: blur(2px); box-shadow: 0 0 20px rgba(37, 211, 102, 0.3); }
  }

  .chat-input-area input {
    flex: 1; 
    background: transparent; 
    border: none; 
    padding: 12px 5px; 
    color: var(--text); 
    font-size: 16px; 
    outline: none;
  }
</style>
`;
// Replace the old input area CSS
html = html.replace(/\.chat-input-area \{[\s\S]*?outline: none;\s*\}/, geminiCSS);

// 2. Wrap the input field in the new glow wrapper HTML
// Find the input area and wrap it
const oldHTML = `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    <input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">
    <div class="send-btn" onclick="sendMessage()">➤</div>
  </div>`;

const newHTML = `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    
    <div class="input-glow-wrapper">
      <input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">
    </div>
    
    <div class="send-btn" onclick="sendMessage()">➤</div>
  </div>`;

html = html.replace(oldHTML, newHTML);

fs.writeFileSync('index.html', html);
console.log('✅ Gemini Stardust Glow added to the chat input!');
