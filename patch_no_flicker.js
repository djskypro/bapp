const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the message box right before we load messages
const oldLoad = `    const msgBox = document.getElementById('chat-messages');                                            msgBox.innerHTML = "";`;
const newLoad = `    const msgBox = document.getElementById('chat-messages');
    msgBox.style.opacity = '0'; // Hide it while loading
    msgBox.innerHTML = "";`;

if (html.includes(oldLoad)) {
    html = html.replace(oldLoad, newLoad);
}

// 2. Force the scroll immediately and fade in
const oldScroll = `    if (savedScroll !== null) {
      // Restore where the user left off (multiple times to fight image loading)
      const restoreScroll = () => {
        if(msgBox) msgBox.scrollTop = parseInt(savedScroll);
      };
      restoreScroll();
      setTimeout(restoreScroll, 100);
      setTimeout(restoreScroll, 300);
      setTimeout(restoreScroll, 600);
    } else {`;

const newScroll = `    if (savedScroll !== null) {
      // Restore where the user left off instantly
      msgBox.scrollTop = parseInt(savedScroll);
      
      // Show it right away (or use a tiny timeout to let it settle)
      setTimeout(() => { msgBox.style.opacity = '1'; }, 50);
      
      // Keep forcing it just in case images load slowly
      setTimeout(() => { msgBox.scrollTop = parseInt(savedScroll); }, 200);
      setTimeout(() => { msgBox.scrollTop = parseInt(savedScroll); }, 500);
    } else {`;

if (html.includes(oldScroll)) {
    html = html.replace(oldScroll, newScroll);
}

// 3. Make sure we fade in for new chats too
html = html.replace(
  `      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
    }`,
  `      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
      setTimeout(() => { msgBox.style.opacity = '1'; }, 50);
    }`
);

fs.writeFileSync('index.html', html);
console.log("✅ No-flicker scroll added!");
