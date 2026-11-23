const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Fly-Up CSS Animation
const flyCSS = `
<style>
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(80px) scale(0.8);
      opacity: 0;
    }
    50% {
      transform: translateY(-10px) scale(1.02);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  .msg.fly-in {
    animation: flyUpFromInput 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
</style>
</head>
`;
html = html.replace('</head>', flyCSS);

// 2. Inject the animation trigger into your EXACT sendMessage function
const oldSend = `      // 1. Show on screen immediately
      appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');
      input.value = '';`;

const newSend = `      // 1. Show on screen immediately
      appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');
      
      // --- ADD THE FLY ANIMATION ---
      const msgBox = document.getElementById('chat-messages');
      if (msgBox && msgBox.lastElementChild) {
          const lastMsg = msgBox.lastElementChild;
          lastMsg.classList.add('fly-in');
          // Remove the class after animation ends so it doesn't replay
          setTimeout(() => lastMsg.classList.remove('fly-in'), 400); 
      }
      // -----------------------------

      input.value = '';`;

if (html.includes(oldSend)) {
    html = html.replace(oldSend, newSend);
    fs.writeFileSync('index.html', html);
    console.log('✅ Fly-in message animation successfully added!');
} else {
    console.log('❌ Could not find the exact send block.');
}
