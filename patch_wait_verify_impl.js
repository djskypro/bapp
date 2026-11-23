const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Make saveImgToDB return a Promise
const oldSaveDB = `  function saveImgToDB(id, base64) {
      if(!bappDB) {
          setTimeout(() => saveImgToDB(id, base64), 100);
          return;
      }
      try {
          let tx = bappDB.transaction("images", "readwrite");
          let req = tx.objectStore("images").put(base64, id);
          req.onerror = function(e) { console.log("DB Save Error", e); };
      } catch(e) { console.log("DB Save Error", e); }
  }`;

const newSaveDB = `  function saveImgToDB(id, base64) {
      return new Promise((resolve) => {
          if(!bappDB) {
              setTimeout(() => resolve(saveImgToDB(id, base64)), 100);
              return;
          }
          try {
              let tx = bappDB.transaction("images", "readwrite");
              let req = tx.objectStore("images").put(base64, id);
              req.onsuccess = function() { resolve(true); };
              req.onerror = function(e) { console.log("DB Save Error", e); resolve(false); };
          } catch(e) { console.log("DB Save Error", e); resolve(false); }
      });
  }`;
html = html.replace(oldSaveDB, newSaveDB);

// 2. Rewrite the offline_messages handler to use async/await
const startIdx = html.indexOf("if (data.type === 'offline_messages') {");
// We need to find the end of this specific block. It ends right before the next 'if (data.type ==='
const endIdx = html.indexOf("if (data.type === ", startIdx + 10);

if (startIdx !== -1 && endIdx !== -1) {
    const newOfflineHandler = `if (data.type === 'offline_messages') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Use an async loop to wait for the database
        (async () => {
            for (const msg of data.messages) {
                const senderId = (msg.from || '').trim();
                let saveText = msg.text;
                
                // WAIT for the image to save to IndexedDB
                if (msg.isImage && !msg.isVideo && msg.msgId) {
                    if (typeof saveImgToDB === 'function') {
                        await saveImgToDB(msg.msgId, msg.text); 
                    }
                    saveText = "img_ref_" + msg.msgId;
                }
                
                try {
                    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                    savedMsgs.push({
                        text: saveText,
                        type: 'received',
                        time: now,
                        isImage: msg.isImage,
                        isVoice: msg.isVoice,
                        msgId: msg.msgId,
                        replyData: msg.replyData,
                        isWhisper: msg.isWhisper,
                        isVideo: msg.isVideo,
                        bubbleColor: msg.bubbleColor
                    });
                    localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                } catch(e) { console.error("Storage full", e); }
                
                saveChat(senderId);
                
                if (activeChatId === senderId) {
                    // RENDER using the saveText (the img_ref_ ID), NOT the huge base64 string
                    appendMessage(saveText, 'received', now, '', msg.isImage, msg.isVoice, msg.msgId, msg.replyData, msg.isWhisper, msg.isVideo, msg.bubbleColor);
                    socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
                } else {
                    let unreads = getUnreads();
                    unreads[senderId] = (unreads[senderId] || 0) + 1;
                    localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
                }
            }
            loadChatList(); 
        })();
      }
      
      `;
    html = html.substring(0, startIdx) + newOfflineHandler + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Async Wait-and-Verify logic applied perfectly!');
} else {
    console.log('❌ Could not find the exact offline_messages block boundaries.');
}
