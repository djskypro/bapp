const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_4.html');

let html = fs.readFileSync('index.html', 'utf8');
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// 2. Replace the Profile Picture uploader with a Compressed version
const oldPicUploadStart = js.indexOf("document.getElementById('settings-pic-input').addEventListener");
const oldPicUploadEnd = js.indexOf("// --- RECEIVE ---");

const newPicUpload = `
  document.getElementById('settings-pic-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // COMPRESS PROFILE PICTURE
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200; // 200x200 pixels is perfect for a DP
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Draw image centered and cropped to square
        const size = Math.min(img.width, img.height);
        const xOffset = (img.width - size) / 2;
        const yOffset = (img.height - size) / 2;
        ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, MAX_SIZE, MAX_SIZE);

        // Compress to low-quality JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        myProfile.avatar = compressedBase64;
        document.getElementById('settings-avatar').src = compressedBase64;
        
        // Show a quick alert so the user knows it worked
        console.log("Profile picture compressed and ready to save.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  `;

js = js.substring(0, oldPicUploadStart) + newPicUpload + js.substring(oldPicUploadEnd);

// 3. Add try/catch to saveProfile to prevent silent crashes
const oldSave = `localStorage.setItem('bapp_profile', JSON.stringify(myProfile));`;
const newSave = `try {
        localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    } catch(e) {
        alert("Storage is full! Could not save DP.");
        return;
    }`;
js = js.replace(oldSave, newSave);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Profile picture compressor added! Save will now work on Samsung Internet.');
