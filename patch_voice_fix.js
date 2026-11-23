const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the entire appendMessage function to support Voice cleanly
const oldAppendStart = html.indexOf('function appendMessage(');
const oldAppendEnd = html.indexOf('function sendMessage(');

const newAppend = `
  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
      // If you add the full screen viewer later, put it here
      newMsg.appendChild(img);
    } else if (isVoice) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = text;
      audio.style.width = '220px';
      audio.style.height = '40px';
      audio.style.outline = 'none';
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
    
    // Insert before the spacer if it exists, otherwise just append
    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  `;
html = html.substring(0, oldAppendStart) + newAppend + html.substring(oldAppendEnd);

// 2. Fix the openChat loading sequence to pass isVoice
const oldLoad = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage));`;
const newLoad = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice));`;
html = html.replace(oldLoad, newLoad);

// 3. Replace the toggleRecording function to save isVoice properly
const oldRecordStart = html.indexOf('async function toggleRecording() {');
const oldRecordEnd = html.indexOf('// Show/Hide Send vs Mic button based on typing');

const newRecord = `
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
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true }));
            
            // Append UI
            appendMessage(base64Audio, 'sent', now, 'sent', false, true);
            
            // Save to local storage
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            
            // Update chat list preview
            loadChatList();
          };
        };

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerText = '⏹️';
        chatInput.placeholder = "Recording...";
        chatInput.disabled = true;
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
    }
  }

  `;
html = html.substring(0, oldRecordStart) + newRecord + html.substring(oldRecordEnd);

// 4. Fix the socket.onmessage to handle voice properly
const oldSocketStart = html.indexOf("if (data.type === 'new_message') {");
const oldSocketEnd = html.indexOf("} catch(err) { console.error(\"Socket Error:\", err); }");

const newSocket = `
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
        } catch(e) { console.error("Storage full"); }
        
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
      }
    `;
html = html.substring(0, oldSocketStart) + newSocket + html.substring(oldSocketEnd);


fs.writeFileSync('index.html', html);
console.log('✅ Voice notes and UI fixed permanently!');
