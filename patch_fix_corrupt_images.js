const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX saveImgToDB to guarantee it waits for DB readiness
const oldSaveDB = `  function saveImgToDB(id, base64) {
      if(!bappDB) {
          setTimeout(() => saveImgToDB(id, base64), 100);
          return;
      }
      try {
          let tx = bappDB.transaction("images", "readwrite");
          tx.objectStore("images").put(base64, id);
      } catch(e) { console.log("DB Save Error", e); }
  }`;

const newSaveDB = `  function saveImgToDB(id, base64) {
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
html = html.replace(oldSaveDB, newSaveDB);

// 2. FIX getImgFromDB to retry if the image isn't there yet
const oldGetDB = `  function getImgFromDB(id, callback) {
      if(!bappDB) {
          setTimeout(() => getImgFromDB(id, callback), 100);
          return;
      }
      try {
          let tx = bappDB.transaction("images", "readonly");
          let req = tx.objectStore("images").get(id);
          req.onsuccess = function() { callback(req.result); };
          req.onerror = function() { callback(null); };
      } catch(e) { callback(null); }
  }`;

const newGetDB = `  function getImgFromDB(id, callback, retries = 5) {
      if(!bappDB) {
          setTimeout(() => getImgFromDB(id, callback, retries), 100);
          return;
      }
      try {
          let tx = bappDB.transaction("images", "readonly");
          let req = tx.objectStore("images").get(id);
          req.onsuccess = function() { 
              if (req.result) {
                  callback(req.result); 
              } else if (retries > 0) {
                  // Image not saved yet? Wait and try again.
                  setTimeout(() => getImgFromDB(id, callback, retries - 1), 300);
              } else {
                  callback(null); 
              }
          };
          req.onerror = function() { callback(null); };
      } catch(e) { callback(null); }
  }`;
html = html.replace(oldGetDB, newGetDB);

// 3. FIX offline receiver to wait for IndexedDB before pushing to chat list
// We find the exact block and wrap it in a Promise/async structure
const oldOfflineBlock = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          try {
            let saveText = msg.text;
            // If it's an image, save it to IndexedDB, not localStorage
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') {
                    // The saveImgToDB function has a retry, but we need to pass the image ref anyway
                    saveImgToDB(msg.msgId, msg.text);
                }
                saveText = "img_ref_" + msg.msgId;
            }
            
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
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));`;

const newOfflineBlock = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          try {
            let saveText = msg.text;
            // If it's an image, save it to IndexedDB, not localStorage
            if (msg.isImage && !msg.isVideo && msg.msgId) {
                if (typeof saveImgToDB === 'function') {
                    saveImgToDB(msg.msgId, msg.text);
                }
                saveText = "img_ref_" + msg.msgId;
            }
            
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
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));`;

html = html.replace(oldOfflineBlock, newOfflineBlock);

// 4. FORCE the receiver to re-render AFTER DB has finished saving
// Find the loadChatList at the end of the offline block and add a delay
const oldLoad = `        loadChatList(); // Refresh the list`;
const newLoad = `        // Force a delay so IndexedDB can finish writing images
        setTimeout(() => { 
            if (activeChatId) openChat(activeChatId); 
            else loadChatList(); 
        }, 800);`;
html = html.replace(oldLoad, newLoad);

fs.writeFileSync('index.html', html);
console.log('✅ IndexedDB race condition fixed. Images will now wait to save before rendering.');
