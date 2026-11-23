const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldVideo = `      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         pendingMediaBase64 = e.target.result;
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {`;

const newVideo = `      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         
         // Use Object URL for preview (doesn't eat memory)
         const videoUrl = URL.createObjectURL(file);
         pendingMediaBase64 = videoUrl;
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + videoUrl + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {`;

html = html.replace(oldVideo, newVideo);

// Also fix confirmMediaSend for videos
const oldSend = `        // Upload via HTTP (Multer), not WebSocket
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        formData.append('image', blob, 'img_' + Date.now() + '.jpg');`;

const newSend = `        // Upload via HTTP (Multer), not WebSocket
        const blob = await (await fetch(pendingMediaBase64)).blob();
        const formData = new FormData();
        const extension = pendingIsVideo ? '.mp4' : '.jpg';
        const filePrefix = pendingIsVideo ? 'video' : 'image';
        formData.append('image', blob, filePrefix + '_' + Date.now() + extension);`;

html = html.replace(oldSend, newSend);

fs.writeFileSync('index.html', html);
console.log('✅ Client now uploads videos via HTTP, no more storage crashes!');
