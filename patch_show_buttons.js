const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the SENDER's popup (startTrivia)
// Find the startTrivia function and force the buttons to display
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
    
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    
    // FORCE BUTTONS TO SHOW
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';
    
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    isPlayer1 = true;
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }`;
html = html.replace(startTriviaRegex, newStartTrivia);

// 2. Fix the RECEIVER's popup (Interceptor in new_message)
const interceptorRegex = /if \(data\.text === "🏆 I invited you to play Trivia!"\) \{[\s\S]*?isPlayer1 = false;\s*\}/;
const newInterceptor = `if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                
                // FORCE BUTTONS TO SHOW
                document.getElementById('trivia-ready-btn').style.display = 'block';
                document.getElementById('trivia-not-ready-btn').style.display = 'block';

                isPlayer1 = false;
            }
        }`;
html = html.replace(interceptorRegex, newInterceptor);

// 3. Fix the acceptTriviaMatch function to hide buttons and start
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

// 4. Make sure when game starts, buttons stay hidden
html = html.replace(/document\.getElementById\('trivia-ready-btn'\)\.style\.display = 'none';/g, "document.getElementById('trivia-ready-btn').style.display = 'none';\n    document.getElementById('trivia-not-ready-btn').style.display = 'none';");

fs.writeFileSync('index.html', html);
console.log("✅ Buttons forced to display!");
