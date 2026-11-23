const fs = require('fs');

// ==========================================
// 1. FIX CLIENT (IndexedDB Retry & Image Render)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Fix saveImgToDB to wait for DB
const oldSaveDB = `  function saveImgToDB(id, base64) {
      if(!bappDB) return;
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
          tx.objectStore("images").put(base64, id);
      } catch(e) { console.log("DB Save Error", e); }
  }`;
html = html.replace(oldSaveDB, newSaveDB);

// B. Fix getImgFromDB to wait for DB
const oldGetDB = `  function getImgFromDB(id, callback) {
      if(!bappDB) { callback(null); return; }
      try {
          let tx = bappDB.transaction("images", "readonly");
          let req = tx.objectStore("images").get(id);
          req.onsuccess = function() { callback(req.result); };
          req.onerror = function() { callback(null); };
      } catch(e) { callback(null); }
  }`;
const newGetDB = `  function getImgFromDB(id, callback) {
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
html = html.replace(oldGetDB, newGetDB);

// C. Fix the Image Rendering block (from your terminal output)
const oldImgRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

const newImgRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('img_ref_')) {
          const realId = text.replace('img_ref_', '');
          img.style.minHeight = '150px';
          img.style.backgroundColor = 'rgba(255,255,255,0.05)';
          img.style.borderRadius = '10px';
          
          getImgFromDB(realId, function(base64Data) {
              if(base64Data) {
                  img.src = base64Data;
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
              }
          });
      } else {
          img.src = text; 
      }
      
      img.onclick = function(e) { 
          e.stopPropagation(); 
          if (img.src && img.src.startsWith('data:image')) {
              openFullscreenMedia(img.src); 
          }
      };
      newMsg.appendChild(img);
    }`;

if(html.includes(oldImgRender)) {
    html = html.replace(oldImgRender, newImgRender);
}
fs.writeFileSync('index.html', html);

// ==========================================
// 2. FIX SERVER (Safe DB Save)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerSave = `            } else {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({`;
                
const newServerSave = `            } else {
                let db = {};
                try {
                    db = JSON.parse(fs.readFileSync(DB_FILE));
                } catch(e) { console.log("DB was empty or corrupted, creating new."); }
                
                if (!db[cleanTo]) db[cleanTo] = [];
                db[cleanTo].push({`;

if(serverJs.includes(oldServerSave)) {
    serverJs = serverJs.replace(oldServerSave, newServerSave);
    
    // Add a safety check around the write
    const oldWrite = `                fs.writeFileSync(DB_FILE, JSON.stringify(db));`;
    const newWrite = `                try {
                    fs.writeFileSync(DB_FILE, JSON.stringify(db));
                } catch(e) { console.log("Failed to write to offline DB (maybe storage full?):", e); }`;
                    
    serverJs = serverJs.replace(oldWrite, newWrite);
}

fs.writeFileSync('server.js', serverJs);
console.log('✅ Client DB Retry and Server DB safety activated!');
