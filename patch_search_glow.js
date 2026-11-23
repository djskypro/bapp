const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the glow from the chat input (Revert to normal)
const badChatInput = `<div class="gemini-wrapper">
      <div class="gemini-glow"></div>
      <input type="text" id="chat-input" class="gemini-input" placeholder="Message" onkeypress="handleEnter(event)">
    </div>`;
const normalChatInput = `<input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">`;
html = html.replace(badChatInput, normalChatInput);

// 2. Add the Search Bar Glow CSS
const newCSS = `
  /* SEARCH BAR GEMINI GLOW */
  .search-glow-wrapper {
    position: relative;
    padding: 2px;
    border-radius: 14px;
    display: flex;
    width: 100%;
  }
  .search-glow {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: radial-gradient(circle at 10% 50%, rgba(37, 211, 102, 0.8) 0%, transparent 40%),
                radial-gradient(circle at 90% 50%, rgba(0, 150, 255, 0.8) 0%, transparent 40%),
                radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 6px 6px;
    animation: geminiPulse 3s infinite alternate;
    z-index: 0;
  }
  .search-box-inner {
    width: 100%;
    position: relative;
    z-index: 1;
    background: rgba(15, 15, 20, 0.95);
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 10px 15px;
    gap: 10px;
  }
  .search-box-inner input {
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 16px;
    width: 100%;
    outline: none;
  }
  @keyframes geminiPulse {
    0% { opacity: 0.5; filter: blur(1px); transform: scale(0.98); }
    100% { opacity: 1; filter: blur(3px); transform: scale(1.02); }
  }
</style>
`;
html = html.replace('</style>', newCSS);

// 3. Replace the Search Bar HTML
const oldSearch = `<div class="search-box">
      <span>🔍</span>
      <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
    </div>`;
const newSearch = `<div class="search-glow-wrapper">
      <div class="search-glow"></div>
      <div class="search-box-inner">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="Search username..." oninput="handleSearchInput()" autocomplete="off">
      </div>
    </div>`;

if(html.includes(oldSearch)) {
    html = html.replace(oldSearch, newSearch);
    fs.writeFileSync('index.html', html);
    console.log('✅ Gemini Glow moved to the Search Bar perfectly!');
} else {
    console.log('❌ Could not find the search bar. Aborting.');
}
