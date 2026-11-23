const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_5.html');

let html = fs.readFileSync('index.html', 'utf8');
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// 2. Replace the picture uploader with a memory-safe URL object loader
const oldPicUploadStart = js.indexOf("document.getElementById('settings-pic-input').addEventListener");
const oldPicUploadEnd = js.indexOf("// --- RECEIVE ---");

const newPicUpload = `
  document.getElementById('settings-pic-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    // Use Object URL instead of FileReader to prevent RAM crashes on large images
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 300; // 300x300 is perfect for a DP
      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;
      const ctx = canvas.getContext('2d');
      
      // Crop to square
      const size = Math.min(img.width, img.height);
      const xOffset = (img.width - size) / 2;
      const yOffset = (img.height - size) / 2;
      
      ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
      
      // Compress heavily to save space
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      
      myProfile.avatar = compressedBase64;
      document.getElementById('settings-avatar').src = compressedBase64;
      
      // Flash the image so the user knows it processed
      document.getElementById('settings-avatar').style.opacity = '0.5';
      setTimeout(() => document.getElementById('settings-avatar').style.opacity = '1', 300);
      
      URL.revokeObjectURL(objectUrl); // Free the memory
    };
    
    img.onerror = function() {
      alert("Could not load this image. Try a different one.");
      URL.revokeObjectURL(objectUrl);
    };
    
    img.src = objectUrl;
  });

  `;

js = js.substring(0, oldPicUploadStart) + newPicUpload + js.substring(oldPicUploadEnd);

// 3. Add a Storage Cleanup to the Save Button
const oldSave = js.substring(js.indexOf('function saveProfile()'), js.indexOf("document.getElementById('settings-pic-input')"));
const newSave = `
  function saveProfile() {
    myProfile.name = document.getElementById('settings-name-input').value || myBappId;
    myProfile.bio = document.getElementById('settings-bio').value;
    myProfile.phone = document.getElementById('settings-phone').value;
    myProfile.location = document.getElementById('settings-location').value;
    myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    
    try {
        localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
    } catch(e) {
        // Storage is full! Let's clean up old image messages to make room.
        console.log("Storage full. Cleaning up old images...");
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith('bapp_msgs_')) {
                let msgs = JSON.parse(localStorage.getItem(key)) || [];
                // Remove base64 image strings to free up space
                msgs.forEach(m => { if(m.isImage) m.text = "📷 [Image cleared to save space]"; });
                localStorage.setItem(key, JSON.stringify(msgs));
            }
        }
        // Try saving again
        try {
            localStorage.setItem('bapp_profile', JSON.stringify(myProfile));
        } catch(e2) {
            alert("Your phone storage is completely full! Please refresh the page.");
            return;
        }
    }
    
    // Save to local user profiles database
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    profiles[myBappId] = myProfile;
    localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
    
    // Notify server
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    
    // Visual feedback
    const btn = document.querySelector('.save-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Saved! ✅';
    btn.style.background = '#2ecc71';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = 'var(--primary)';
        goBack();
    }, 1000);
  }
`;
js = js.replace(oldSave, newSave);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Memory-safe uploader and storage cleaner added!');
