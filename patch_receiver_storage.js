const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact block from line 2205-2209
const oldReceive1 = `        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) { console.error("Storage full"); }`;

// The exact block from line 2669-2673
const oldReceive2 = `        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {}`;

// The new safe logic with auto-cleanup
const newReceiveLogic = (msgObjStr) => `        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push(${msgObjStr});
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.warn("Receiver storage full! Clearing old images...");
          for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              if (key.startsWith('bapp_msgs_')) {
                  let msgs = JSON.parse(localStorage.getItem(key)) || [];
                  let changed = false;
                  msgs.forEach(m => {
                      if (m.isImage && m.text && m.text.startsWith('data:image')) {
                          m.text = "📷 [Image removed to save space]";
                          m.isImage = false;
                          changed = true;
                      }
                  });
                  if (changed) localStorage.setItem(key, JSON.stringify(msgs));
              }
          }
          // Retry saving the new message
          try {
              const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
              savedMsgs.push(${msgObjStr});
              localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e2) { console.error("Still full after cleanup."); }
        }`;

// Apply to both blocks safely
if (html.includes(oldReceive1)) {
    html = html.replace(oldReceive1, newReceiveLogic("{ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper }"));
}

if (html.includes(oldReceive2)) {
    html = html.replace(oldReceive2, newReceiveLogic("{ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData }"));
}

fs.writeFileSync('index.html', html);
console.log('✅ Receiver storage auto-cleanup added successfully!');
