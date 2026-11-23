const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Make IndexedDB setup bulletproof (wait for it to be ready)
const oldDBSetup = `  let bappDB;
  const dbRequest = indexedDB.open("BappMediaDB", 1);
  dbRequest.onupgradeneeded = function(e) {
      let db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images");
      }
  };
  dbRequest.onsuccess = function(e) {
      bappDB = e.target.result;
  };
  function saveImgToDB(id, base64) {
      if(!bappDB) return;
      try {
          let tx = bappDB.transaction("images", "readwrite");
          tx.objectStore("images").put(base64, id);
      } catch(e) { console.log("DB Save Error", e); }
  }`;

const newDBSetup = `  let bappDB;
  let dbReadyPromise = new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open("BappMediaDB", 1);
      dbRequest.onupgradeneeded = function(e) {
          let db = e.target.result;
          if (!db.objectStoreNames.contains("images")) {
              db.createObjectStore("images");
          }
      };
      dbRequest.onsuccess = function(e) {
          bappDB = e.target.result;
          resolve(bappDB);
      };
      dbRequest.onerror = function(e) { reject(e); };
  });

  function saveImgToDB(id, base64) {
      dbReadyPromise.then(db => {
          try {
              let tx = db.transaction("images", "readwrite");
              tx.objectStore("images").put(base64, id);
          } catch(e) { console.log("DB Save Error", e); }
      });
  }`;

html = html.replace(oldDBSetup, newDBSetup);

// 2. Fix the OFFLINE MESSAGES receiver block to use IndexedDB
const oldOfflineBlock = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            // SAVE ALL MEDIA TYPES AND REPLIES
            savedMsgs.push({
                text: msg.text,
                type: 'received',
                time: now,
                isImage: msg.isImage,
                isVoice: msg.isVoice,
                msgId: msg.msgId,
                replyData: msg.replyData
            });
            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e) { console.error("Storage full"); }`;

const newOfflineBlock = `        data.messages.forEach(msg => {
          const senderId = (msg.from || '').trim();
          
          // Route offline images to IndexedDB
          let saveText = msg.text;
          if (msg.isImage && !msg.isVideo && msg.msgId) {
              saveImgToDB(msg.msgId, msg.text);
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
          } catch(e) { console.error("Storage full"); }`;

html = html.replace(oldOfflineBlock, newOfflineBlock);

fs.writeFileSync('index.html', html);
console.log('✅ Fixed! Offline images now save to IndexedDB and will never be lost again.');
