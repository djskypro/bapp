const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the HTML buttons: Remove display:none and add the Not Ready button
const oldBtnHTML = `<button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer; display:none;">✅ I'm Ready</button>`;
const newBtnHTML = `
  <div id="trivia-actions" style="display:flex; gap:10px; margin-top:15px; justify-content:center;">
    <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="flex:1; background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer;">✅ I'm Ready</button>
    <button id="trivia-not-ready-btn" onclick="declineTriviaMatch()" style="flex:1; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border:1px solid #e74c3c; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer;">❌ Not Ready</button>
  </div>
`;
html = html.replace(oldBtnHTML, newBtnHTML);

// 2. Fix startTrivia to show the buttons
const oldStartLogic = `document.getElementById('trivia-input-area').style.display = 'none';`;
const newStartLogic = `document.getElementById('trivia-input-area').style.display = 'none';
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';`;
// Only replace the one inside startTrivia (we use a regex to be safe)
html = html.replace(/function startTrivia\(\) \{[\s\S]*?document\.getElementById\('trivia-input-area'\)\.style\.display = 'none';/, 
    `function startTrivia() {
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
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';`);

// 3. Add declineTriviaMatch function
const declineFunction = `
  function declineTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'You declined the game.';
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'decline', to: activeChatId, from: myBappId }));
    }
  }
`;
html = html.replace('function acceptTriviaMatch() {', declineFunction + '\nfunction acceptTriviaMatch() {');

// 4. Fix the first interceptor (line 3933) to show both buttons
html = html.replace(/if \(data\.text === "🏆 I invited you to play Trivia!"\) \{[\s\S]*?isPlayer1 = false;\s*\}/, 
`if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                document.getElementById('trivia-ready-btn').style.display = 'block';
                document.getElementById('trivia-not-ready-btn').style.display = 'block';
                isPlayer1 = false;
            }
        }`);

// 5. Fix the second interceptor (line 7447)
html = html.replace(/if \(data\.type === 'new_message' && data\.text === "🏆 I invited you to play Trivia!"\) \{[\s\S]*?isPlayer1 = false;\s*\}/,
`if (data.type === 'new_message' && data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            game.style.display = 'flex';
            document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
            document.getElementById('trivia-question').style.display = 'none';
            document.getElementById('trivia-input-area').style.display = 'none';
            document.getElementById('trivia-ready-btn').style.display = 'block';
            document.getElementById('trivia-not-ready-btn').style.display = 'block';
            isPlayer1 = false;
          }`);

fs.writeFileSync('index.html', html);
console.log("✅ All buttons and logic fixed!");
