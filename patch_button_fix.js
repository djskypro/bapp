const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the trivia-start-btn and change it into the Ready button
// We use a regex that matches the button with the id "trivia-start-btn"
const oldButtonRegex = /<button id="trivia-start-btn"[^>]*>.*?<\/button>/;
const newButton = `<button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer; display:none;">✅ I'm Ready</button>`;
html = html.replace(oldButtonRegex, newButton);

// 2. Make sure the startTrivia function shows this new button
html = html.replace("document.getElementById('trivia-ready-btn').style.display = 'block';\n    document.getElementById('trivia-ready-btn').innerText = \"✅ I'm Ready\";", "");
// Add the display logic cleanly to startTrivia
const startTriviaRegex = /function startTrivia\(\) \{[\s\S]*?if \(typeof closeChatMenu === 'function'\) closeChatMenu\(\);\s*\}/;
const newStartTrivia = `function startTrivia() {
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const inviteMsg = "🏆 I invited you to play Trivia!";
      const payload = {
        type: 'send_message', to: activeChatId, from: myBappId, text: inviteMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      if (typeof appendMessage === 'function') {
        appendMessage(inviteMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
    document.getElementById('trivia-game').style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    
    const readyBtn = document.getElementById('trivia-ready-btn');
    if(readyBtn) readyBtn.style.display = 'block';
    
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    isPlayer1 = true;
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }`;
html = html.replace(startTriviaRegex, newStartTrivia);

// 3. Update the interceptor for the receiver to show the correct button
html = html.replace("readyBtn.innerText = \"✅ I'm Ready\";", "");

fs.writeFileSync('index.html', html);
console.log("✅ HTML Button fixed and wired to acceptTriviaMatch!");
