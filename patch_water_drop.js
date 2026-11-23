const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the Water Drop CSS
const waterCSS = `
<style>
  /* The text box shrinking into a water drop */
  @keyframes makeDrop {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.8) translateY(20px); opacity: 0.5; border-radius: 20px; }
    100% { transform: scale(0.1) translateY(100px); opacity: 0; border-radius: 50%; }
  }
  .input-drop-anim {
    animation: makeDrop 0.4s ease-in forwards !important;
  }

  /* The message splashing into the chat */
  @keyframes splashUp {
    0% { 
      transform: scale(0.2) translateY(120px); 
      opacity: 0;
      border-radius: 50%; 
    }
    50% { 
      transform: scale(1.1) translateY(-10px); 
      opacity: 1;
      border-radius: 50%; 
    }
    100% { 
      transform: scale(1) translateY(0); 
      opacity: 1;
      border-radius: 12px; 
    }
  }
  .msg-water-pop {
    animation: splashUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
  }
</style>
</head>
`;
html = html.replace('</head>', waterCSS);

// 2. Add the animation trigger to appendMessage (Line 2685)
const oldAppendEnd = `    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;`;

const newAppendEnd = `    // --- WATER DROP SPLASH ANIMATION ---
    if (type === 'sent') {
        newMsg.classList.add('msg-water-pop');
        setTimeout(() => newMsg.classList.remove('msg-water-pop'), 550); 
    }

    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;`;

if (html.includes(oldAppendEnd)) {
    html = html.replace(oldAppendEnd, newAppendEnd);
}

// 3. Add the input drop trigger to sendMessage
const oldSendClear = `    input.value = '';`;

const newSendClear = `    input.value = ''; 
    
    // MAKE THE INPUT BOX DROP
    const inputArea = document.querySelector('.chat-input-area');
    if (inputArea) {
        inputArea.classList.add('input-drop-anim');
        setTimeout(() => inputArea.classList.remove('input-drop-anim'), 400);
    }`;

// Replace only inside sendMessage
const sendStart = html.indexOf('function sendMessage() {');
const sendEnd = html.indexOf('}', sendStart);
let sendBlock = html.substring(sendStart, sendEnd);
if (sendBlock.includes(oldSendClear)) {
    sendBlock = sendBlock.replace(oldSendClear, newSendClear);
    html = html.substring(0, sendStart) + sendBlock + html.substring(sendEnd);
}

fs.writeFileSync('index.html', html);
console.log('✅ Water Drop and Splash animation applied perfectly!');
