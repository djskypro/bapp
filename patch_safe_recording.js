const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. ADD THE RECORDING UI HTML
// ==========================================
// Find the chat input area and add the hidden recording area right below it
const inputAreaHTML = `</div>
  <div class="chat-input-area">`;

const recordingUI = `</div>

  <!-- RECORDING UI (Hidden by default) -->
  <div class="chat-input-area" id="recording-input-area" style="display:none; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:15px;">
      <div onclick="cancelRecording()" style="background:#e74c3c; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; cursor: pointer;">🗑️</div>
      <div style="color:#e74c3c; font-weight:bold; font-size:16px; animation: pulse 1s infinite alternate;">🔴 Recording...</div>
    </div>
    <div onclick="sendRecording()" style="background:var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black; font-size: 20px; cursor: pointer;">➤</div>
  </div>

  <div class="chat-input-area">`;

// Try to find the end of the input area or just the start of it
if(html.includes('<div class="chat-input-area">')) {
    // If there are multiple chat-input-areas, we only want to replace the first one
    html = html.replace('<div class="chat-input-area">', recordingUI);
}

// ==========================================
// 2. OVERWRITE THE RECORDING LOGIC
// ==========================================
// Find the exact start and end of the old toggleRecording function
const oldRecStart = html.indexOf('async function toggleRecording() {');
const oldRecEnd = html.indexOf('// Show/Hide Send vs Mic button based on typing');

const newRecLogic = `
  let isRecording = false;
  let mediaRecorder;
  let audioChunks = [];

  async function toggleRecording() {
    if (isRecording) return; // Prevent double clicks

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.start();
      isRecording = true;
      
      // Swap UI
      document.getElementById('normal-input-area').style.display = 'none';
      document.getElementById('recording-input-area').style.display = 'flex';
      
      // Notify server & Chat List
      if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: true }));
      }
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  }

  function cancelRecording() {
    if (!isRecording) return;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Reset UI
    document.getElementById('normal-input-area').style.display = 'flex';
    document.getElementById('recording-input-area').style.display = 'none';
    
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
    }
  }

  function sendRecording() {
    if (!isRecording) return;
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result;
        const to = activeChatId;
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true }));
        
        // The global appendMessage function we backed up will handle this perfectly
        appendMessage(base64Audio, 'sent', now, 'sent', false, true);
        
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
      };
    };

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording = false;
    
    // Reset UI
    document.getElementById('normal-input-area').style.display = 'flex';
    document.getElementById('recording-input-area').style.display = 'none';
    
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
    }
  }

`;
html = html.substring(0, oldRecStart) + newRecLogic + html.substring(oldRecEnd);

// Need to make sure normal input area has an ID
html = html.replace('<div class="chat-input-area" id="normal-input-area"', '<div class="chat-input-area" id="normal-input-area"'); // Just in case
if(!html.includes('id="normal-input-area"')) {
    html = html.replace('<div class="chat-input-area">', '<div class="chat-input-area" id="normal-input-area">');
}

// ==========================================
// 3. SOCKET LISTENER FOR CHAT LIST INDICATOR
// ==========================================
const oldSocketListen = `if (data.type === 'typing') {`;

const newSocketListen = `
      if (data.type === 'recording') {
        const senderId = (data.from || '').trim();
        
        // Update Chat Header if inside chat
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (sub) {
            sub.innerText = data.isRecording ? '🔴 recording audio...' : '🔒 End-to-End Encrypted';
            sub.style.color = data.isRecording ? '#e74c3c' : 'var(--text-muted)';
            sub.style.fontWeight = data.isRecording ? 'bold' : 'normal';
          }
        }

        // Update Chat List Preview
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isRecording) {
            previewEl.innerText = '🔴 recording audio...';
            previewEl.style.color = '#e74c3c';
            previewEl.style.fontWeight = 'bold';
          } else {
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);
            }
            previewEl.innerText = lastMsgText;
            previewEl.style.color = 'var(--text-muted)';
            previewEl.style.fontWeight = 'normal';
          }
        }
      }

      if (data.type === 'typing') {`;

html = html.replace(oldSocketListen, newSocketListen);

fs.writeFileSync('index.html', html);
console.log('✅ Safe recording UI and Chat List indicator injected!');
