const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD THE STEGANOGRAPHY FUNCTIONS AT THE END OF THE SCRIPT
const stegJS = `
  // --- STEGANOGRAPHY FUNCTIONS ---
  function encodeMessage(imageSrc, secretMessage, callback) {
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          // Add \0 to the end so we know when the message stops
          const text = secretMessage + '\\0'; 
          let binary = '';
          for (let i = 0; i < text.length; i++) {
              binary += text.charCodeAt(i).toString(2).padStart(8, '0');
          }
          
          let dataIndex = 0;
          for (let i = 0; i < binary.length; i++) {
              if (dataIndex >= data.length) break;
              // Modify the Least Significant Bit of the Red channel
              const bit = parseInt(binary[i]);
              data[dataIndex] = (data[dataIndex] & 0xFE) | bit;
              dataIndex += 4; // Jump to next pixel's Red channel
          }
          
          ctx.putImageData(imgData, 0, 0);
          // MUST use PNG for lossless encoding
          callback(canvas.toDataURL('image/png')); 
      };
      img.src = imageSrc;
  }

  function decodeMessage(imageSrc) {
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          let binary = '';
          for (let i = 0; i < data.length; i += 4) {
              binary += (data[i] & 1).toString();
              if (binary.length >= 8) {
                  const charCode = parseInt(binary.slice(-8), 2);
                  if (charCode === 0) break; // Found the \0 terminator
                  if (binary.length > 100000) break; // Safety limit
              }
          }
          
          let text = '';
          for (let i = 0; i < binary.length; i += 8) {
              const charCode = parseInt(binary.slice(i, i + 8), 2);
              if (charCode === 0) break;
              text += String.fromCharCode(charCode);
          }
          
          if (text) {
              alert("🔍 SECRET MESSAGE FOUND:\\n\\n" + text);
          } else {
              alert("No hidden message found in this image.");
          }
      };
      img.src = imageSrc;
  }
`;

// 2. REPLACE CONFIRMMEDIASEND TO ASK FOR SECRET MESSAGE
const oldSendStart = html.indexOf('  function confirmMediaSend() {');
const oldSendEnd = html.indexOf('  function openSettings()'); // Assuming this comes after

const newSendFunc = `  function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    const to = activeChatId;
    const isVid = pendingIsVideo;
    const msgId = Date.now().toString();
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    // Function to actually send the message
    const sendData = (finalBase64) => {
        document.getElementById('media-preview-modal').style.display = 'none';
        
        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: finalBase64, isImage: !isVid, isVideo: isVid, msgId: msgId, replyData: reply }));
        appendMessage(finalBase64, 'sent', now, 'sent', !isVid, false, msgId, reply, false, isVid);
        
        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];

        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: finalBase64, type: 'sent', time: now, isImage: !isVid, isVideo: isVid, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e) { console.error("Storage full"); }
    };

    // If it's an image, ask for a secret message
    if (!isVid) {
        const secret = prompt("🕵️ Enter a secret message to hide inside this photo (Leave blank for normal photo):");
        if (secret && secret.trim() !== "") {
            // Encode the message and send the new PNG
            encodeMessage(pendingMediaBase64, secret.trim(), sendData);
            return;
        }
    }
    
    // Normal send if no secret or if it's a video
    sendData(pendingMediaBase64);
  }

`;

if(oldSendStart !== -1 && oldSendEnd !== -1) {
    html = html.substring(0, oldSendStart) + newSendFunc + html.substring(oldSendEnd);
}

// 3. UPDATE APPENDMESSAGE TO ADD THE DECODE BUTTON
const oldImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      newMsg.appendChild(img);
    }`;

const newImageRender = `    } else if (isImage) {
      const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      newMsg.appendChild(img);
      
      // Add Decode button
      const decodeBtn = document.createElement('div');
      decodeBtn.innerText = '🔍 Decode';
      decodeBtn.style.cssText = 'background:rgba(0,0,0,0.5); color:var(--primary); border:1px solid var(--primary); border-radius:10px; padding:4px 10px; font-size:11px; margin-top:5px; cursor:pointer; width:fit-content;';
      decodeBtn.onclick = function() { decodeMessage(text); };
      newMsg.appendChild(decodeBtn);
    }`;

html = html.replace(oldImageRender, newImageRender);

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + stegJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Steganography activated! You can now hide secret messages in photos.');
} else {
    console.log('❌ Could not find script tag.');
}
