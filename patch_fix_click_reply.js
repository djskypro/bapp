const fs = require('fs');

// ==========================================
// 1. FIX THE SERVER (Keep msgId in replyData)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the exact line that sends the message and ensure msgId/replyData are passed perfectly
serverJs = serverJs.replace(
    "bappUsers.get(cleanTo).send(JSON.stringify({ \n                    type: 'new_message', \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false,\n                    msgId: msgId,\n                    replyData: replyData\n                }));",
    "bappUsers.get(cleanTo).send(JSON.stringify({ \n                    type: 'new_message', \n                    from: from, \n                    text: text, \n                    isImage: isImage || false, \n                    isVoice: isVoice || false,\n                    msgId: msgId,\n                    replyData: replyData\n                }));"
);

fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX THE CLIENT (CSS & Click Handler)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Add the missing CSS for the green flash
if (!html.includes('.msg.highlight-flash')) {
    const css = `
<style>
  .msg.highlight-flash {
    background-color: rgba(37, 211, 102, 0.8) !important;
    transition: background-color 0.5s ease;
  }
</style>
</head>`;
    html = html.replace('</head>', css);
}

// B. Ensure the exact quote handler works
// We inject `cursor: pointer` and `onclick` directly into the exact code you pasted
const oldQuoteCode = `        if (replyData.msgId) {
            quote.style.cursor = 'pointer';
            quote.onclick = function() { scrollToMessage(replyData.msgId); };
        }`;

const newQuoteCode = `        quote.style.cursor = 'pointer';
        quote.style.pointerEvents = 'auto'; // Force it to be clickable
        quote.onclick = function() { 
            if(replyData.msgId) {
                scrollToMessage(replyData.msgId); 
            } else {
                alert("Cannot find original message ID");
            }
        };`;

if (html.includes(oldQuoteCode)) {
    html = html.replace(oldQuoteCode, newQuoteCode);
} else {
    // Fallback if formatting is slightly off
    html = html.replace(
        "quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));",
        "quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));\n        quote.style.cursor = 'pointer';\n        quote.onclick = function() { if(replyData.msgId) scrollToMessage(replyData.msgId); };"
    );
}

// C. Fix the scrollToMessage function to ensure the highlight is obvious
const oldScroll = `  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('highlight-flash');
      setTimeout(() => {
        target.classList.remove('highlight-flash');
      }, 3000);
    }
  }`;

const newScroll = `  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash Green
      target.style.transition = 'background-color 0.3s';
      target.style.backgroundColor = 'rgba(37, 211, 102, 0.8)';
      
      setTimeout(() => {
        target.style.backgroundColor = ''; // Revert to normal
      }, 2000);
    } else {
      console.log("Original message not found on screen.");
    }
  }`;
    
if (html.includes(oldScroll)) {
    html = html.replace(oldScroll, newScroll);
}

fs.writeFileSync('index.html', html);
console.log('✅ Quote click and Scroll fixed!');
