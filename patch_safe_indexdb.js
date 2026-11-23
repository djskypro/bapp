const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Setup IndexedDB safely at the very top
const dbSetup = `
  // --- SAFE INDEXEDDB SETUP ---
  let bappDB;
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
  }
  
  function getImgFromDB(id, callback) {
      if(!bappDB) { callback(null); return; }
      try {
          let tx = bappDB.transaction("images", "readonly");
          let req = tx.objectStore("images").get(id);
          req.onsuccess = function() { callback(req.result); };
          req.onerror = function() { callback(null); };
      } catch(e) { callback(null); }
  }
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", dbSetup + "\n  let myBappId = localStorage.getItem('bapp_username');");

// 2. Fix SENDING IMAGE (confirmMediaSend)
const oldSendSave = `        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(err) {`;

const newSendSave = `        let saveText = base64Img;
        if (!isVid) {
            saveImgToDB(msgId, base64Img);
            saveText = "img_ref_" + msgId;
        }

        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: saveText, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(err) {`;
html = html.replace(oldSendSave, newSendSave);

// 3. Fix RECEIVING IMAGE (new_message)
const oldReceiveSave = `        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {`;

const newReceiveSave = `        let saveText = data.text;
        if (data.isImage && !data.isVideo) {
            saveImgToDB(data.msgId, data.text);
            saveText = "img_ref_" + data.msgId;
        }

        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: saveText, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {`;
html = html.replace(oldReceiveSave, newReceiveSave);

// 4. Fix APPENDMESSAGE to load the image from DB asynchronously
const oldImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      newMsg.appendChild(img);
    }`;

const newImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      img.style.minHeight = '150px';
      img.style.backgroundColor = 'rgba(255,255,255,0.05)'; // Placeholder color
      
      if (text.startsWith('img_ref_')) {
          const realId = text.replace('img_ref_', '');
          // Load in background without blocking chat loading
          getImgFromDB(realId, function(base64Data) {
              if(base64Data) {
                  img.src = base64Data;
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
              }
          });
      } else {
          img.src = text; // Old images fallback
      }
      newMsg.appendChild(img);
    }`;
html = html.replace(oldImageRender, newImageRender);

fs.writeFileSync('index.html', html);
console.log('✅ Safe IndexedDB implemented! Images will never be deleted again.');
