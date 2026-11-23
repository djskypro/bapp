const fs = require('fs');

// ==========================================
// 1. PATCH SERVER (Route the recording signal)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

const newServerLogic = `
        if (data.type === 'recording') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify({ type: 'recording', from: data.from, isRecording: data.isRecording }));
            }
        }
`;

// Insert it right before the typing logic
serverJs = serverJs.replace("if (data.type === 'typing') {", newServerLogic + "\n        if (data.type === 'typing') {");
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. PATCH UI (Send signal & Update Header)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Send the signal when recording starts and stops
const oldStartRecord = `mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerText = '⏹️';
        chatInput.placeholder = "Recording...";
        chatInput.disabled = true;`;

const newStartRecord = `mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerText = '⏹️';
        chatInput.placeholder = "Recording...";
        chatInput.disabled = true;
        
        // Send signal to the other user
        if (activeChatId && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: true }));
        }`;

const oldStopRecord = `mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;

      micBtn.classList.remove('recording');
      micBtn.innerText = '🎤';
      chatInput.placeholder = "Message";
      chatInput.disabled = false;`;

const newStopRecord = `mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;

      micBtn.classList.remove('recording');
      micBtn.innerText = '🎤';
      chatInput.placeholder = "Message";
      chatInput.disabled = false;
      
      // Stop signal
      if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
      }`;

html = html.replace(oldStartRecord, newStartRecord);
html = html.replace(oldStopRecord, newStopRecord);

// B. Handle the received signal in socket.onmessage
const oldSocketHandler = `if (data.type === 'typing') {`;
const newSocketHandler = `
      if (data.type === 'recording') {
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
      }

      if (data.type === 'typing') {`;

html = html.replace(oldSocketHandler, newSocketHandler);

// C. Ensure the recording signal stops if you hit back while recording
const oldGoBack = `function goBack() {
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', to: activeChatId, from: myBappId, isTyping: false }));
    }`;
const newGoBack = `function goBack() {
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', to: activeChatId, from: myBappId, isTyping: false }));
        if (typeof isRecording !== 'undefined' && isRecording) {
            socket.send(JSON.stringify({ type: 'recording', to: activeChatId, from: myBappId, isRecording: false }));
        }
    }`;
html = html.replace(oldGoBack, newGoBack);

fs.writeFileSync('index.html', html);
console.log('✅ Live Recording indicator added successfully!');
