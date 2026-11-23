const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD THE RECORDING UI HTML (Hidden by default)
const oldInputArea = `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    
    <div class="gemini-wrapper">
      <div class="gemini-glow"></div>
      <input type="text" id="chat-input" class="gemini-input" placeholder="Message" onkeypress="handleEnter(event)">
    </div>
    
    <div class="send-btn" onclick="sendMessage()">➤</div>
  </div>`;

// If the gemini wrapper isn't there, fallback to the standard one
const actualOldArea = html.includes(oldInputArea) ? oldInputArea : `<div class="chat-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    <input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">
    <div id="mic-btn" onclick="toggleRecording()" style="background:var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black; font-size: 20px; cursor: pointer; margin-left: 5px;">🎤</div>
    <div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>
  </div>`;

const newInputArea = `<div class="chat-input-area" id="normal-input-area">
    <div class="attach-btn" onclick="document.getElementById('file-input').click()">📎</div>
    <input type="file" id="file-input" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
    <input type="text" id="chat-input" placeholder="Message" onkeypress="handleEnter(event)">
    <div id="mic-btn" onclick="startRecording()" style="background:var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black; font-size: 20px; cursor: pointer; margin-left: 5px;">🎤</div>
    <div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>
  </div>

  <!-- RECORDING UI (Hidden by default) -->
  <div class="chat-input-area" id="recording-input-area" style="display:none; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:10px;">
      <div class="delete-rec-btn" onclick="cancelRecording()" style="background:#e74c3c; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; cursor: pointer;">🗑️</div>
      <div style="color:#e74c3c; font-weight:bold; font-size:16px; animation: pulse 1s infinite alternate;">🔴 Recording...</div>
    </div>
    <div class="send-rec-btn" onclick="sendRecording()" style="background:var(--primary); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: black; font-size: 20px; cursor: pointer;">➤</div>
  </div>`;

html = html.replace(actualOldArea, newInputArea);

// 2. REPLACE THE RECORDING LOGIC
const oldRecStart = html.indexOf('async function toggleRecording() {');
const oldRecEnd = html.indexOf('// Show/Hide Send vs Mic button based on typing');

const newRecLogic = `
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  async function startRecording() {
    if (isRecording) return;
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
      console.error(err);
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
    
    // Notify server
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
    
    // Notify server
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
    }
  }

`;
html = html.substring(0, oldRecStart) + newRecLogic + html.substring(oldRecEnd);

// 3. UPDATE SOCKET LISTENER FOR CHAT LIST PREVIEW
const oldSocketListen = `if (data.type === 'recording') {
        const senderId = (data.from || '').trim();
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (data.isRecording) {
            sub.innerText = '🔴 recording audio...';
            sub.style.color = '#e74c3c';
            sub.style.fontWeight = 'bold';
          } else {
            sub.innerText = '🔒 End-to-End Encrypted';
            sub.style.color = 'var(--text-muted)';
            sub.style.fontWeight = 'normal';
          }
        }
      }`;

const newSocketListen = `if (data.type === 'recording') {
        const senderId = (data.from || '').trim();
        
        // 1. Update Chat Header if inside chat
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (data.isRecording) {
            sub.innerText = '🔴 recording audio...';
            sub.style.color = '#e74c3c';
            sub.style.fontWeight = 'bold';
          } else {
            sub.innerText = '🔒 End-to-End Encrypted';
            sub.style.color = 'var(--text-muted)';
            sub.style.fontWeight = 'normal';
          }
        }

        // 2. Update Chat List Preview
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isRecording) {
            previewEl.innerText = '🔴 recording audio...';
            previewEl.style.color = '#e74c3c';
            previewEl.style.fontWeight = 'bold';
          } else {
            // Revert back to last message
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
      }`;

html = html.replace(oldSocketListen, newSocketListen);

// 4. Clean up goBack logic
const oldGoBack = html.substring(html.indexOf('function goBack() {'), html.indexOf('function appendMessage('));
const newGoBack = `function goBack() {
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', to: activeChatId, from: myBappId, isTyping: false }));
        if (typeof isRecording !== 'undefined' && isRecording) {
            cancelRecording(); // Cancel if they leave while recording
        }
    }
    activeChatId = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
    loadChatList();
  }
  `;
html = html.substring(0, html.indexOf('function goBack() {')) + newGoBack + html.substring(html.indexOf('function appendMessage('));


fs.writeFileSync('index.html', html);
console.log('✅ Two-button recording UI and Chat List indicator added!');
