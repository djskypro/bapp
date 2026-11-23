const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX TEXT MESSAGES: Clear reply right after sending text
const oldTextSend = `      localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
      loadChatList();
      if (typeof cancelReply === 'function') cancelReply();
    }
  }`;
const newTextSend = `      localStorage.setItem('bapp_msgs_' + activeChatId, JSON.stringify(savedMsgs));
      loadChatList();
      
      // Force clear the reply box
      document.getElementById('reply-preview').style.display = 'none';
      currentReplyTo = null;
      if (window.replyState) delete window.replyState[activeChatId];
    }
  }`;
html = html.replace(oldTextSend, newTextSend);

// 2. FIX IMAGE MESSAGES: Clear reply right after sending an image
const oldImgSend = `      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      if (typeof cancelReply === 'function') cancelReply();`;
const newImgSend = `      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      loadChatList();
      
      // Force clear the reply box
      document.getElementById('reply-preview').style.display = 'none';
      currentReplyTo = null;
      if (window.replyState) delete window.replyState[to];`;
html = html.replace(oldImgSend, newImgSend);

// 3. FIX VOICE MESSAGES: Clear reply right after sending a voice note
const oldVoiceSend = `            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            if (typeof cancelReply === 'function') cancelReply();`;
const newVoiceSend = `            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
            
            // Force clear the reply box
            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];`;
html = html.replace(oldVoiceSend, newVoiceSend);

fs.writeFileSync('index.html', html);
console.log('✅ Reply box will now auto-hide immediately after sending any message (Text, Image, or Voice).');
