const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_3.html');

let html = fs.readFileSync('index.html', 'utf8');
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// 2. Replace the handleImageUpload function with a resizing version
const oldUploadStart = js.indexOf('function handleImageUpload(event)');
const oldUploadEnd = js.indexOf('function openSettings()');
if(oldUploadStart === -1) { console.log("Could not find handleImageUpload"); process.exit(1); }

const newUpload = `
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const to = document.getElementById('chat-name').textContent.trim();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // --- IMAGE COMPRESSOR ---
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 60% quality
        const base64Img = canvas.toDataURL('image/jpeg', 0.6); 

        // Send via Socket
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true }));
        
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        appendMessage(base64Img, 'sent', now, 'sent', true);
        
        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(err) {
            alert("Phone memory is full! Please clear some chats.");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

`;

js = js.substring(0, oldUploadStart) + newUpload + js.substring(oldUploadEnd);

// 3. Add try/catch to receiving messages so a large image doesn't crash the socket
const oldReceive = `const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
        savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
        localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));`;
const newReceive = `try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.error("Local storage full, could not save image.");
        }`;
js = js.replace(oldReceive, newReceive);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Image compressor added! Large photos will now send perfectly.');
