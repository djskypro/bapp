
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

            // Send to server
            const msgId = Date.now().toString();
            const reply = currentReplyTo;
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true, msgId: msgId, replyData: reply }));
            
            // Append UI
            appendMessage(base64Audio, 'sent', now, 'sent', false, true, msgId, reply);
            
            // Save to local storage
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            
            // Update chat list preview
            loadChatList();
          };
        };

        mediaRecorder.start();
        
        // Setup Live Waveform
        const canvas = document.getElementById('live-waveform');
        if(canvas) {
          const canvasCtx = canvas.getContext('2d');
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(mediaRecorder.stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          
          window.drawVisual = function() {
            if (!isRecording) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            requestAnimationFrame(window.drawVisual);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.fillStyle = '#e74c3c';
            
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2;
            }
          };
          window.drawVisual();
        }
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerText = '⏹️';
        chatInput.placeholder = "Recording...";
        chatInput.disabled = true;
        
        // Send signal to the other user
        if (activeChatId && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: true }));
        }
      } catch (err) {
        alert("Microphone access denied or not available.");
        console.error(err);
      }
    } else {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;

      micBtn.classList.remove('recording');
      micBtn.innerText = '🎤';
      chatInput.placeholder = "Message";
      chatInput.disabled = false;
      
      // Stop signal
      if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
      }
    }
  }

  // Show/Hide Send vs Mic button based on typing
  document.getElementById('chat-input').addEventListener('input', function() {
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    const whisperBtn = document.getElementById('whisper-toggle');
    
    if (this.value.trim().length > 0) {
      // Show send and whisper, hide mic
      micBtn.style.display = 'none';
      sendBtn.style.display = 'flex';
      whisperBtn.style.display = 'flex';
    } else {
      // Hide send and whisper, show mic
      micBtn.style.display = 'flex';
      sendBtn.style.display = 'none';
      whisperBtn.style.display = 'none';
      
      // If we stop typing, turn off whisper mode so it resets
      if (window.isWhisperMode) toggleWhisperMode();
    }
  });

  // --- UPDATE APPEND MESSAGE FOR VOICE ---
  const oldAppend = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    console.log("APPEND #2 CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      img.onclick = function() { openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
    } else if (isVoice) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = text;
      newMsg.appendChild(audio);
    } else {
      
      if (type === 'received' && typeof text === 'string' && text.length > 0 && !text.startsWith('data:')) {
          const textSpan = document.createElement('span');
          newMsg.appendChild(textSpan);
          
          const originalText = Array.from(text);
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>';
          let iteration = 0;
          
          textSpan.style.color = '#25D366';
          textSpan.style.fontFamily = 'monospace';
          textSpan.style.textShadow = '0 0 8px #25D366';
          
          const interval = setInterval(() => {
              textSpan.innerText = originalText.map((char, index) => {
                  if (index < iteration) return originalText[index];
                  if (char === ' ') return ' ';
                  return chars[Math.floor(Math.random() * chars.length)];
              }).join('');
              
              if (iteration >= originalText.length) {
                  clearInterval(interval);
                  textSpan.style.color = '';
                  textSpan.style.fontFamily = '';
                  textSpan.style.textShadow = '';
              }
              iteration += 1 / 3;
          }, 30);
      } else {
          newMsg.appendChild(document.createTextNode(text));
      }

    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'pending' ? '🕒' : (status === 'read' ? '✓✓' : '✓');
      newMsg.appendChild(check);
    }
    msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };
        // --- TRIGGER POPUP ---
        let pName = (data.isGroup && data.groupId) ? data.groupId : (data.from || "").trim();
        try {
          let p = JSON.parse(localStorage.getItem("bapp_profiles")) || {};
          if (p[pName] && p[pName].name) pName = p[pName].name;
        } catch(e) {}
        let pMsg = data.text || "📷 Media";
        if (typeof pMsg === "string" && (pMsg.startsWith("data:") || pMsg.startsWith("/media/"))) pMsg = "📷 Media";
        if (typeof showMessagePopup === "function") showMessagePopup(pName, pMsg, data.from || data.groupId);

  // --- UPDATE RECEIVE LOGIC ---
  const oldOnMessage = socket.onmessage;
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();
        if (data.senderProfile) {
            let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
            profiles[senderId] = data.senderProfile;
            localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
        }
        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.warn("Receiver storage full! Clearing old images...");
          for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              if (key.startsWith('bapp_msgs_')) {
                  let msgs = JSON.parse(localStorage.getItem(key)) || [];
                  let changed = false;
                  msgs.forEach(m => {
                      if (m.isImage && m.text && m.text.startsWith('data:image')) {
                          m.text = "📷 [Image removed to save space]";
                          m.isImage = false;
                          changed = true;
                      }
                  });
                  if (changed) localStorage.setItem(key, JSON.stringify(msgs));
              }
          }
          // Retry saving the new message
          try {
              const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
              savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
              localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e2) { console.error("Still full after cleanup."); }
        }
        saveChat(senderId);
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);
          safeSendReceipt(senderId);
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
