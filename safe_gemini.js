const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Safely insert the new CSS right before the existing </style> tag
const newCSS = `
  /* GEMINI GLOW INPUT */
  .gemini-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    margin: 0 5px;
  }
  .gemini-glow {
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border-radius: 22px;
    background: radial-gradient(circle at 10% 50%, rgba(37, 211, 102, 0.6) 0%, transparent 30%),
                radial-gradient(circle at 90% 50%, rgba(0, 150, 255, 0.6) 0%, transparent 30%),
                radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 5px 5px;
    animation: geminiPulse 3s infinite alternate;
    z-index: 0;
  }
  .gemini-input {
    width: 100%;
    position: relative;
    z-index: 1;
    background: rgba(15, 15, 20, 0.95);
    border: none;
    border-radius: 20px;
    padding: 14px 15px;
    color: var(--text);
    font-size: 16px;
    outline: none;
  }
  @keyframes geminiPulse {
    0% { opacity: 0.5; filter: blur(1px); }
    100% { opacity: 1; filter: blur(2px); box-shadow: 0 0 15px rgba(37, 211, 102, 0.2); }
  }
</style>
`;
html = html.replace('</style>', newCSS);

// 2. Safely replace ONLY the input area HTML
const oldHTML = `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    <input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">
    <div class="send-btn" onclick="sendMessage()">➤</div>
  </div>`;

const newHTML = `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    
    <div class="gemini-wrapper">
      <div class="gemini-glow"></div>
      <input type="text" id="chat-input" class="gemini-input" placeholder="Message" onkeypress="handleEnter(event)">
    </div>
    
    <div class="send-btn" onclick="sendMessage()">➤</div>
  </div>`;

if(html.includes(oldHTML)) {
    html = html.replace(oldHTML, newHTML);
    fs.writeFileSync('index.html', html);
    console.log('✅ Gemini Glow added safely!');
} else {
    console.log('❌ Could not find the input HTML. Aborting to prevent crashes.');
}
