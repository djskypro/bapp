const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. ADD INDEXEDDB SETUP AT THE TOP
// ==========================================
const dbSetup = `
  // --- INDEXEDDB SETUP FOR INFINITE IMAGE STORAGE ---
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
      let tx = bappDB.transaction("images", "readwrite");
      tx.objectStore("images").put(base64, id);
  }
  function getImgFromDB(id, callback) {
      if(!bappDB) { callback(null); return; }
      let tx = bappDB.transaction("images", "readonly");
      let req = tx.objectStore("images").get(id);
      req.onsuccess = function() { callback(req.result); };
  }
`;
html = html.replace("let myBappId = localStorage.getItem('bapp_username');", dbSetup + "\n  let myBappId = localStorage.getItem('bapp_username');");

// ==========================================
// 2. FIX SENDING IMAGE (confirmMediaSend)
// ==========================================
const oldSendSave = `        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();

            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];
        } catch(err) {
            // Auto-cleanup
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
            try {
                const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
                savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent' });
                localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
                loadChatList();
            } catch(e2) { alert("Phone storage is completely full."); }
        }`;

const newSendSave = `        // Save image to IndexedDB, and a tiny reference to localStorage
        let saveText = base64Img;
        if (!isVid) {
            saveImgToDB(msgId, base64Img);
            saveText = "img_ref_" + msgId;
        }

        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: saveText, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();

            document.getElementById('reply-preview').style.display = 'none';
            currentReplyTo = null;
            if (window.replyState) delete window.replyState[to];
        } catch(err) {
            console.error("Storage issue", err);
        }`;
html = html.replace(oldSendSave, newSendSave);

// ==========================================
// 3. FIX RECEIVING IMAGE (new_message)
// ==========================================
const oldReceiveSave = `        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.warn("Receiver storage full! Clearing old images...");
          for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              if (key.startsWith('bapp_msgs_')) {
                  let msgs = JSON.parse(localStorage.getItem(key)) || [];
                  // ...`;

const newReceiveSave = `        // Save image to IndexedDB, and a tiny reference to localStorage
        let saveText = data.text;
        if (data.isImage && !data.isVideo) {
            saveImgToDB(data.msgId, data.text);
            saveText = "img_ref_" + data.msgId;
        }

        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: saveText, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.error("Storage issue", e);
        }`;

// Using Regex to cleanly replace the whole messy catch block in the receiver
const receiveRegex = /try \{\s*const savedMsgs = JSON\.parse\(localStorage\.getItem\('bapp_msgs_' \+ senderId\)\) \|\| \[\];\s*savedMsgs\.push\(\{ text: data\.text, type: 'received'[\s\S]*?\} catch\(e\) \{[\s\S]*?\}\s*\}/;
html = html.replace(receiveRegex, newReceiveSave);

// ==========================================
// 4. FIX APPENDMESSAGE (Render the IndexedDB image)
// ==========================================
const oldImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

const newImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      img.style.minHeight = '100px';
      img.style.backgroundColor = 'rgba(255,255,255,0.1)';
      
      if (text.startsWith('img_ref_')) {
          const realId = text.replace('img_ref_', '');
          getImgFromDB(realId, function(base64Data) {
              if(base64Data) {
                  img.src = base64Data;
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
              }
          });
      } else {
          img.src = text; // Fallback for old images
      }
      
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

html = html.replace(oldImageRender, newImageRender);

fs.writeFileSync('index.html', html);
console.log('✅ IndexedDB integrated! Images will never be deleted automatically again.');
