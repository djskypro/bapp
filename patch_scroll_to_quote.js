const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Highlight CSS
const css = `
<style>
  .msg.highlight-flash {
    background-color: rgba(37, 211, 102, 0.8) !important; /* WhatsApp Green */
    transition: background-color 0.5s ease;
  }
</style>
</head>`;
if(!html.includes('.msg.highlight-flash')) {
    html = html.replace('</head>', css);
}

// 2. Add the scrollToMessage function
const scrollLogic = `
  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      // Scroll to the message smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add the green highlight
      target.classList.add('highlight-flash');
      
      // Remove the highlight after 3 seconds
      setTimeout(() => {
        target.classList.remove('highlight-flash');
      }, 3000);
    }
  }
`;
html = html.replace("function attachContextMenu(el, msgId, text, isMe) {", scrollLogic + "\n  function attachContextMenu(el, msgId, text, isMe) {");

// 3. Update appendMessage to add the ID to the DOM element and make the quote clickable
const oldAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    // Render the Quoted Message if it exists
    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        newMsg.appendChild(quote);
    }`;

const newAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id; // Add unique ID for scrolling

    // Render the Quoted Message if it exists
    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        
        // Make the quote clickable to jump to the original message
        if (replyData.msgId) {
            quote.style.cursor = 'pointer';
            quote.onclick = function() { scrollToMessage(replyData.msgId); };
        }
        
        newMsg.appendChild(quote);
    }`;

html = html.replace(oldAppendStart, newAppendStart);

fs.writeFileSync('index.html', html);
console.log('✅ Tap-to-jump to quoted messages added perfectly!');
