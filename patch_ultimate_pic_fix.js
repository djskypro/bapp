const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the Image Rendering block to retry if the DB isn't ready
const oldRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('img_ref_')) {
          // It's an IndexedDB image. Load it safely.
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
          // Fallback for old normal images
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

const newRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      // Function to load image with retry
      const loadImgWithRetry = (id, retries) => {
          img.style.minHeight = '150px';
          img.style.backgroundColor = 'rgba(255,255,255,0.05)';
          img.style.borderRadius = '10px';
          
          getImgFromDB(id, function(base64Data) {
              if(base64Data) {
                  img.src = base64Data;
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
              } else if (retries > 0) {
                  setTimeout(() => loadImgWithRetry(id, retries - 1), 300);
              } else {
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
                  img.alt = "Image failed to load";
              }
          });
      };

      if (text.startsWith('img_ref_')) {
          const realId = text.replace('img_ref_', '');
          loadImgWithRetry(realId, 5); // Try 5 times
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

html = html.replace(oldRender, newRender);

// 2. Fix the offline images to save properly
const oldOfflineImg = `if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                await saveImgToDB(msg.msgId, msg.text);
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }`;

const newOfflineImg = `if (msg.isImage && !msg.isVideo && msg.msgId) {
                            if (typeof saveImgToDB === 'function') {
                                console.log("Saving offline image to DB:", msg.msgId);
                                const success = await saveImgToDB(msg.msgId, msg.text);
                                if (!success) console.error("Image failed to save to DB!");
                            }
                            saveText = "img_ref_" + msg.msgId;
                        }`;

html = html.replace(oldOfflineImg, newOfflineImg);

fs.writeFileSync('index.html', html);
console.log('✅ Image loader now retries and saves properly!');
