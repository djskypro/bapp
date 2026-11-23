const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old static whisper button from the input area
html = html.replace('<div id="whisper-toggle" onclick="toggleWhisperMode()" style="font-size: 20px; padding: 5px; cursor: pointer; opacity: 0.5; transition: 0.2s;">👻</div>', '');

// 2. Insert the Ghost button right BEFORE the send button (which is already hidden by default)
const oldSendBtn = `<div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>`;
const newSendBtn = `<div id="whisper-toggle" onclick="toggleWhisperMode()" style="display:none; width: 45px; height: 45px; border-radius: 50%; background: var(--search-bg); justify-content: center; align-items: center; font-size: 20px; cursor: pointer; margin-right: 5px; transition: 0.2s;">👻</div>
    <div class="send-btn" onclick="sendMessage()" id="send-btn" style="display:none;">➤</div>`;

// Only replace if it hasn't been replaced yet
if(html.includes(oldSendBtn)) {
    html = html.replace(oldSendBtn, newSendBtn);
}

// 3. Update the typing input event to show/hide the ghost button
const oldInputListener = `document.getElementById('chat-input').addEventListener('input', function() {
    const micBtn = document.getElementById('mic-btn');
    const sendBtn = document.getElementById('send-btn');
    if (this.value.trim().length > 0) {
      micBtn.style.display = 'none';
      sendBtn.style.display = 'flex';
    } else {
      micBtn.style.display = 'flex';
      sendBtn.style.display = 'none';
    }
  });`;

const newInputListener = `document.getElementById('chat-input').addEventListener('input', function() {
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
  });`;

if(html.includes(oldInputListener)) {
    html = html.replace(oldInputListener, newInputListener);
} else {
    // Fallback to regex if spacing is off
    const regex = /document\.getElementById\('chat-input'\)\.addEventListener\('input', function\(\) \{[\s\S]*?\}\);/;
    html = html.replace(regex, newInputListener);
}

// 4. Update the toggleWhisperMode function to visually change the new button
const oldToggle = `  function toggleWhisperMode() {
    window.isWhisperMode = !window.isWhisperMode;
    const btn = document.getElementById('whisper-toggle');
    if (window.isWhisperMode) {
      btn.style.opacity = '1';
      btn.style.textShadow = '0 0 10px #fff';
      document.getElementById('chat-input').placeholder = "Whisper message...";
    } else {
      btn.style.opacity = '0.5';
      btn.style.textShadow = 'none';
      document.getElementById('chat-input').placeholder = "Message";
    }
  }`;

const newToggle = `  function toggleWhisperMode() {
    window.isWhisperMode = !window.isWhisperMode;
    const btn = document.getElementById('whisper-toggle');
    if (window.isWhisperMode) {
      btn.style.background = '#25D366'; // Green when active
      btn.style.boxShadow = '0 0 15px rgba(37,211,102,0.5)';
      document.getElementById('chat-input').placeholder = "Whisper message...";
    } else {
      btn.style.background = 'var(--search-bg)'; // Normal when inactive
      btn.style.boxShadow = 'none';
      document.getElementById('chat-input').placeholder = "Message";
    }
  }`;

if(html.includes(oldToggle)) {
    html = html.replace(oldToggle, newToggle);
} else {
    const regex = /function toggleWhisperMode\(\) \{[\s\S]*?\}\s*\}/;
    html = html.replace(regex, newToggle);
}

fs.writeFileSync('index.html', html);
console.log('✅ Ghost button now dynamically appears when typing and toggles perfectly!');
