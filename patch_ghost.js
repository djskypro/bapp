const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Ghost Mode CSS & Button to the Header
const ghostBtnHTML = `
  <div id="ghost-toggle" onclick="toggleGhostMode()" style="cursor:pointer; font-size:20px; margin-left:10px; opacity:0.5; transition:0.3s;" title="Ghost Mode">👻</div>
`;
// Inject right before the end of the chat-header icons div
const headerIconsRegex = /(<div class="header-action-icons">[\s\S]*?)(<\/div>)/;
html = html.replace(headerIconsRegex, '$1' + ghostBtnHTML + '$2');

// 2. Add the Toggle JS and Intercept Receipts
// We find the first read_receipt and inject our logic right before the socket.send
const ghostLogic = `
  // --- GHOST MODE LOGIC ---
  window.ghostMode = localStorage.getItem('bapp_ghost_mode') === 'true';
  
  function toggleGhostMode() {
    window.ghostMode = !window.ghostMode;
    localStorage.setItem('bapp_ghost_mode', window.ghostMode);
    updateGhostUI();
  }
  
  function updateGhostUI() {
    const btn = document.getElementById('ghost-toggle');
    if (btn) {
      btn.style.opacity = window.ghostMode ? '1' : '0.5';
      btn.style.color = window.ghostMode ? '#25D366' : 'inherit'; // Green when active
      btn.style.textShadow = window.ghostMode ? '0 0 10px #25D366' : 'none';
    }
  }
  
  setTimeout(updateGhostUI, 1000); // Init UI on load

  function safeSendReceipt(toId) {
    if (window.ghostMode) {
      console.log('👻 Ghost Mode: Read receipt blocked.');
      return;
    }
    socket.send(JSON.stringify({ type: 'read_receipt', to: toId, from: myBappId }));
  }
`;

// Insert the logic right before the first read_receipt send
html = html.replace(/socket\.send\(JSON\.stringify\(\{ type: 'read_receipt', to: id, from: myBappId \}\)\);/g, "safeSendReceipt(id);");
html = html.replace(/socket\.send\(JSON\.stringify\(\{ type: 'read_receipt', to: senderId, from: myBappId \}\)\);/g, "safeSendReceipt(senderId);");

// Inject the logic script into the head so it's available globally
html = html.replace('</head>', `<script>\n${ghostLogic}\n</script>\n</head>`);

fs.writeFileSync('index.html', html);
console.log("✅ Ghost Mode added! Look for the 👻 icon in the chat header.");
