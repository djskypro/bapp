const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the appendMessage image rendering to handle URLs
const oldImgRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('img_ref_')) {`;
      
const newImgRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('/media/')) {
          // It's a URL from the server!
          img.src = text;
          img.style.borderRadius = '10px';
          img.style.maxWidth = '100%';
      } else if (text.startsWith('img_ref_')) {`;

html = html.replace(oldImgRender, newImgRender);

// 2. Fix confirmMediaSend to NOT shove Base64 into localStorage
// We will only save a tiny placeholder in localStorage, and let the server handle the URL
const oldConfirmSave = `        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
            
            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];
        } catch(err) {`;

const newConfirmSave = `        try {
            // DON'T save the massive Base64 to localStorage. Just a placeholder.
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: "📷 [Image sent]", type: 'sent', time: now, isImage: false, isVideo: false, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
            
            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];
        } catch(err) {`;

html = html.replace(oldConfirmSave, newConfirmSave);

fs.writeFileSync('index.html', html);
console.log('✅ Client will now render server URLs and stop crashing storage!');
