const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Rename "Status" to "Updates" in the UI
html = html.replace('<h1>Status</h1>', '<h1>Updates</h1>');
html = html.replace('<span>⭕</span>Status', '<span>⭕</span>Updates');
html = html.replace('<div class="status-name">My Status</div>', '<div class="status-name">My Updates</div>');
html = html.replace('Tap to add status update', 'Tap to add update');

// 2. Replace the postStatus function to ONLY pick a photo/video
const oldPostStatus = `function postStatus() {
    const text = prompt("Enter text for your status (or leave blank to upload a photo):");
    if (text === null) return; // User cancelled

    if (text.trim() !== "") {
      socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: text, media: null }));
    } else {
      // Handle Photo Upload
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          // Compress image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 600 * (img.height / img.width);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: base64 }));
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }`;

const newPostStatus = `function postStatus() {
    // Directly open the file picker for both Images and Videos
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = 'image/*,video/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Limit video size to prevent crashing the browser
      if (file.size > 5 * 1024 * 1024) {
          alert("Please select a file smaller than 5MB to prevent crashing.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        
        if (file.type.startsWith('image/')) {
            // Compress Images
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 600; canvas.height = 600 * (img.height / img.width);
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
              socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: compressedBase64 }));
            };
            img.src = base64Data;
        } else if (file.type.startsWith('video/')) {
            // Send Video directly
            socket.send(JSON.stringify({ type: 'add_status', username: myBappId, text: null, media: base64Data }));
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }`;

html = html.replace(oldPostStatus, newPostStatus);

// 3. Update the Viewer to handle Videos
const oldViewerContent = `    const content = document.getElementById('status-viewer-content');
    content.innerHTML = status.media 
      ? \`<img src="\${status.media}">\` 
      : \`<div class="status-viewer-text">\${status.text}</div>\`;`;

const newViewerContent = `    const content = document.getElementById('status-viewer-content');
    
    if (status.media) {
        if (status.media.startsWith('data:video')) {
            content.innerHTML = \`<video src="\${status.media}" autoplay controls style="max-width:100%; max-height:100%;"></video>\`;
        } else {
            content.innerHTML = \`<img src="\${status.media}">\`;
        }
    } else {
        content.innerHTML = \`<div class="status-viewer-text">\${status.text}</div>\`;
    }`;

html = html.replace(oldViewerContent, newViewerContent);

fs.writeFileSync('index.html', html);
console.log('✅ Renamed to Updates and added Photo/Video posting!');
