const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact block from your terminal output (Line 2390)
const oldBlock = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    }`;

const newBlock = `    } else if (isImage) {
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

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Image rendering fixed! Images will now load from IndexedDB.');
} else {
    // Fallback if spacing is slightly off
    html = html.replace(
        "img.src = text;\n      img.style.cursor = 'pointer';",
        `img.style.cursor = 'pointer';
      if (text.startsWith('img_ref_')) {
          const realId = text.replace('img_ref_', '');
          img.style.minHeight = '150px';
          getImgFromDB(realId, function(b64) { if(b64) { img.src = b64; img.style.minHeight = 'auto'; } });
      } else {
          img.src = text;
      }`
    );
    fs.writeFileSync('index.html', html);
    console.log('✅ Image rendering fixed via fallback!');
}
