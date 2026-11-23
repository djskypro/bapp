const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('  function handleImageUpload(event) {');
const endIdx = html.indexOf('  function ', startIdx + 35);

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    event.target.value = ''; 

    document.getElementById('media-preview-modal').style.display = 'flex';
    document.getElementById('preview-loading').style.display = 'block';
    document.getElementById('preview-content').innerHTML = '';
    const sendBtn = document.getElementById('preview-send-btn');
    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';

    // --- CHECK FOR VIDEO FIRST ---
    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        pendingMediaBase64 = URL.createObjectURL(file); // Instant, no memory freeze
        
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
        
        sendBtn.disabled = false;
        sendBtn.style.background = '#25D366';
        sendBtn.style.color = 'black';
        return; // Stop here, don't run FileReader
    }

    // --- IMAGE LOGIC ---
    pendingIsVideo = false;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720; const MAX_HEIGHT = 720;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').innerHTML = '<img src="' + pendingMediaBase64 + '" style="max-width:100%; max-height:70vh; border-radius:15px;">';
        
        sendBtn.disabled = false;
        sendBtn.style.background = '#25D366';
        sendBtn.style.color = 'black';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

`;
    html = html.substring(0, startIdx) + newFunc + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Step 1 Done: Video freeze fixed (bypasses FileReader)!');
} else {
    console.log('❌ Could not find handleImageUpload function.');
}
