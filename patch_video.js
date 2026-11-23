const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the file input to accept videos as well as images
html = html.replace(
    '<input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">',
    '<input type="file" id="file-input" accept="image/*,video/*" style="display:none" onchange="handleImageUpload(event)">'
);

// 2. Add video rendering support to the appendMessage function
// We look for the exact image block from your last output
const oldImageBlock = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function() { openFullscreenMedia(this.src, false); };
      newMsg.appendChild(img);
    } else if (text && text.startsWith('data:video')) {`;

const newImageBlock = `    } else if (isImage) {
      if (text.startsWith('data:video')) {
        // Render Video
        const video = document.createElement('video');
        video.src = text;
        video.style.maxWidth = '100%';
        video.style.borderRadius = '10px';
        video.controls = true; // Add native play/pause controls
        newMsg.appendChild(video);
      } else {
        // Render Image
        const img = document.createElement('img');
        img.src = text;
        img.style.cursor = 'pointer';
        img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
        newMsg.appendChild(img);
      }
    } else if (text && text.startsWith('data:video')) {`;

html = html.replace(oldImageBlock, newImageBlock);

// 3. Update the upload function to handle Videos
// We will find the start of handleImageUpload and replace it entirely
const startUpload = html.indexOf('  function handleImageUpload(event) {');
const endUpload = html.indexOf('  function openSettings()');

const newUploadLogic = `
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const to = activeChatId;
    
    // Check if it's a video
    if (file.type.startsWith('video/')) {
        if (file.size > 10 * 1024 * 1024) {
            alert("Video is too large! Please select a video under 10MB.");
            return;
        }
        
        // Show a small loading indication in console
        console.log("Compressing video...");
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Video = e.target.result;
            const msgId = Date.now().toString();
            const reply = currentReplyTo;
            const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Send to server
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Video, isImage: true, msgId: msgId, replyData: reply }));
            
            // Render on our screen
            appendMessage(base64Video, 'sent', now, 'sent', true, false, msgId, reply);
            
            // Save to local storage
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Video, type: 'sent', time: now, isImage: true, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
            
            if (typeof cancelReply === 'function') cancelReply();
        };
        reader.readAsDataURL(file);
        return;
    }

    // --- OLD IMAGE LOGIC ---
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Img = canvas.toDataURL('image/jpeg', 0.6); 
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Img, isImage: true, msgId: msgId, replyData: reply }));
        
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);
        
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Img, type: 'sent', time: now, isImage: true, status: 'sent', msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
        
        if (typeof cancelReply === 'function') cancelReply();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

`;

html = html.substring(0, startUpload) + newUploadLogic + html.substring(endUpload);

fs.writeFileSync('index.html', html);
console.log('✅ Video sending and rendering added perfectly!');
