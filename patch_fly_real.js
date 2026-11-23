const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the CSS for the fly animation
const flyCSS = `
<style>
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(100px) scale(0.8);
      opacity: 0;
    }
    40% {
      transform: translateY(-15px) scale(1.02);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  .msg.fly-in {
    animation: flyUpFromInput 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
</style>
</head>
`;
if (!html.includes('@keyframes flyUpFromInput')) {
    html = html.replace('</head>', flyCSS);
}

// 2. Remove the broken animation code from sendMessage
const brokenAnim = `// --- ADD THE FLY ANIMATION ---                               
      const msgBoxAnim = document.getElementById('chat-messages');
      
      if (msgBoxAnim && msgBoxAnim.lastElementChild) {
          const lastMsg = msgBoxAnim.lastElementChild;
          lastMsg.classList.add('fly-in');
          setTimeout(() => lastMsg.classList.remove('fly-in'), 400); 
      }
      // -----------------------------`;
// We use regex to catch the broken block with any spacing
html = html.replace(/\/\/ --- ADD THE FLY ANIMATION ---[\s\S]*?\/\/ -----------------------------/g, '');

// 3. Inject the animation directly into appendMessage
// We target the exact block at line 2609 from your output
const oldAppend = `    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;`;

const newAppend = `    // --- FLY ANIMATION FOR SENT MESSAGES ---
    if (type === 'sent') {
        newMsg.classList.add('fly-in');
        setTimeout(() => newMsg.classList.remove('fly-in'), 450); 
    }

    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;`;

if (html.includes(oldAppend)) {
    html = html.replace(oldAppend, newAppend);
    fs.writeFileSync('index.html', html);
    console.log('✅ Fly animation fixed and applied directly to the message bubble!');
} else {
    console.log('❌ Could not find the exact append block.');
}
