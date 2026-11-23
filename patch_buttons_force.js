const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the HTML: remove display:none from the buttons so they are visible by default
html = html.replace(/id="trivia-ready-btn"([^>]*?)display:\s*none;([^>]*?)/g, 'id="trivia-ready-btn"$1$2');
html = html.replace(/id="trivia-not-ready-btn"([^>]*?)display:\s*none;([^>]*?)/g, 'id="trivia-not-ready-btn"$1$2');

// 2. Fix the JS: ensure startTrivia hides the input and shows the buttons
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
    
    const game = document.getElementById('trivia-game');
    if (game) game.style.display = 'flex';
    
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    
    // Force buttons visible via JS
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';
    
    isPlayer1 = true;
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }`;
html = html.replace(startTriviaRegex, newStartTrivia);

// 3. Fix the JS: ensure the receiver's interceptor shows the buttons
const interceptorRegex = /if \(data\.text === "🏆 I invited you to play Trivia!"\) \{[\s\S]*?isPlayer1 = false;\s*\}/;
const newInterceptor = `if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                
                // Force buttons visible via JS
                document.getElementById('trivia-ready-btn').style.display = 'block';
                document.getElementById('trivia-not-ready-btn').style.display = 'block';

                isPlayer1 = false;
            }
        }`;
html = html.replace(interceptorRegex, newInterceptor);

// 4. Fix the JS: ensure acceptTriviaMatch hides the buttons and moves to next state
const acceptRegex = /function acceptTriviaMatch\(\) \{[\s\S]*?\}/;
const newAccept = `function acceptTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to accept...';
    
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'ready', to: activeChatId, from: myBappId }));
    }
  }`;
html = html.replace(acceptRegex, newAccept);

fs.writeFileSync('index.html', html);
console.log("✅ Buttons forced visible!");
