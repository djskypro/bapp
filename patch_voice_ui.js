const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the Mic Button next to the Send Button
const oldSendBtn = `<div class="send-btn" onclick="sendMessage()">➤</div>`;
const newSendBtn = `
    <div class="mic-btn" id="mic-btn" onclick="toggleRecording()" style="background:var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black; font-size: 20px; cursor: pointer; margin-left: 5px;">🎤</div>
    <div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>
`;
html = html.replace(oldSendBtn, newSendBtn);

// 2. Add CSS for audio players
const newCSS = `
<style>
  /* Audio Player Styling */
  .msg audio {
    width: 220px;
    height: 40px;
    margin-bottom: 5px;
    outline: none;
  }
  /* Recording Animation */
  .recording {
    animation: pulseRed 1s infinite alternate;
  }
  @keyframes pulseRed {
    0% { background: #e74c3c; transform: scale(1); }
    100% { background: #ff0000; transform: scale(1.1); }
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 3. Add the Recording Logic & Update AppendMessage/Receive Logic
const voiceJS = `
<script>
  // --- VOICE RECORDING LOGIC ---
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let recordStartTime = 0;

  async function toggleRecording() {
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');

    if (!isRecording) {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            const to = activeChatId;
            const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Send over WebSocket
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true }));
            
            // Update Local Storage & UI
            appendMessage(base64Audio, 'sent', now, 'sent', false, true);
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
          };
        };

        mediaRecorder.start();
        isRecording = true;
        recordStartTime = Date.now();
        
        // Update UI to show recording
        micBtn.classList.add('recording');
        micBtn.innerText = '⏹️'; // Stop icon
        chatInput.placeholder = "Recording...";
        chatInput.disabled = true;

      } catch (err) {
        alert("Microphone access denied or not available on this browser.");
        console.error(err);
      }
    } else {
      // STOP RECORDING
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop()); // release mic
      isRecording = false;

      // Reset UI
      micBtn.classList.remove('recording');
      micBtn.innerText = '🎤';
      chatInput.placeholder = "Message";
      chatInput.disabled = false;
    }
  }

  // Show/Hide Send vs Mic button based on typing
  document.getElementById('chat-input').addEventListener('input', function() {
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    if (this.value.trim().length > 0) {
      micBtn.style.display = 'none';
      sendBtn.style.display = 'flex';
    } else {
      micBtn.style.display = 'flex';
      sendBtn.style.display = 'none';
    }
  });

  // --- UPDATE APPEND MESSAGE FOR VOICE ---
  const oldAppend = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img'); img.src = text; newMsg.appendChild(img);
    } else if (isVoice) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = text;
      newMsg.appendChild(audio);
    } else {
      newMsg.appendChild(document.createTextNode(text));
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'read' ? '✓✓' : '✓';
      newMsg.appendChild(check);
    }
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };

  // --- UPDATE RECEIVE LOGIC ---
  const oldOnMessage = socket.onmessage;
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const senderId = (data.from || '').trim();
        if (data.senderProfile) {
            let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
            profiles[senderId] = data.senderProfile;
            localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
        }
        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {}
        saveChat(senderId);
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice);
          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));
        } else {
          let unreads = getUnreads();
          unreads[senderId] = (unreads[senderId] || 0) + 1;
          localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
        }
        loadChatList();
      } else {
        // Pass typing, read receipts, search, etc. to the original handler
        oldOnMessage.call(socket, event); 
      }
    } catch(err) { console.error(err); }
  };
</script>
</body>
`;
html = html.replace('</body>', voiceJS);

fs.writeFileSync('index.html', html);
console.log('✅ Voice Notes and Mic UI added!');
