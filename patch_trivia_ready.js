const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the Game UI to include the "Ready" screen
const oldUIRegex = /<div id="trivia-game"[\s\S]*?<\/div>\s*<\/div>/;
const newUI = `
<div id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>
    <span onclick="closeTrivia()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>

  <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; margin-bottom:10px;">
    <div style="text-align:center; flex:1;">
      <div style="font-size:12px; color:#aaa;">You</div>
      <div id="score-you" style="font-size:20px; font-weight:bold; color:var(--primary);">0</div>
    </div>
    <div style="width:1px; background:rgba(255,255,255,0.2);"></div>
    <div style="text-align:center; flex:1;">
      <div style="font-size:12px; color:#aaa;">Opponent</div>
      <div id="score-them" style="font-size:20px; font-weight:bold; color:white;">0</div>
    </div>
  </div>
  
  <div id="trivia-status" style="font-size:14px; color:#aaa;">Waiting to start...</div>
  <div id="trivia-question" style="font-size:18px; font-weight:bold; color:white; margin:10px 0; display:none;"></div>
  
  <div id="trivia-input-area" style="display:none; gap:10px; margin-top:10px;">
    <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; outline:none;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
    <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 15px; border-radius:12px; font-weight:bold; cursor:pointer;">Send</button>
  </div>

  <!-- THE READY BUTTON -->
  <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer; display:none;">✅ I'm Ready</button>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// 2. Replace the entire JS Logic with the Handshake State Machine
const oldJSRegex = /<script>\s*const triviaQuestions[\s\S]*?<\/script>/;
const newJS = `
<script>
  const triviaQuestions = [
    { q: "What is the capital of France?", a: "paris" },
    { q: "How many planets are in our solar system?", a: "8" },
    { q: "What is 5 + 7?", a: "12" },
    { q: "Who painted the Mona Lisa?", a: "leonardo da vinci" },
    { q: "What is the largest mammal?", a: "blue whale" }
  ];
  
  let currentTriviaAnswer = null;
  let currentTriviaQuestion = null;
  let triviaScores = { you: 0, them: 0 };
  let isGameActive = false;
  let isPlayer1 = false;

  function startTrivia() {
    // Send the invite message bubble
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

    // Open the board to the READY state
    const game = document.getElementById('trivia-game');
    game.style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    isPlayer1 = true;
    
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function acceptTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to accept...';
    
    // Send "I am ready" signal
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', action: 'ready', to: activeChatId, from: myBappId 
      }));
    }

    if (isPlayer1) {
      // Player 1 is ready, now we must ask Player 2
      // We do this by setting up the opponent's screen to show the Ready button
    }
  }

  function beginTriviaMatch(question, answer) {
    currentTriviaQuestion = question;
    currentTriviaAnswer = answer.toLowerCase().trim();
    isGameActive = true;
    
    document.getElementById('trivia-status').innerText = 'Type your answer below!';
    document.getElementById('trivia-question').innerText = question;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    document.getElementById('trivia-ready-btn').style.display = 'none';

    // Drop the question bubble in chat
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const gameMsg = "🏆 TRIVIA: " + question;
      const payload = {
        type: 'send_message', to: activeChatId, from: myBappId, text: gameMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      if (typeof appendMessage === 'function') {
        appendMessage(gameMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
  }

  function closeTrivia() {
    document.getElementById('trivia-game').style.display = 'none';
    isGameActive = false;
    currentTriviaAnswer = null;
  }

  function submitTriviaAnswer() {
    const input = document.getElementById('trivia-answer-input');
    const answer = input.value.trim();
    if (!answer) return;

    if (isGameActive && currentTriviaAnswer && answer.toLowerCase() === currentTriviaAnswer) {
      currentTriviaAnswer = null;
      isGameActive = false;
      
      triviaScores.you++;
      document.getElementById('score-you').innerText = triviaScores.you;
      document.getElementById('trivia-status').innerText = '🏆 You won the round!';
      document.getElementById('trivia-question').style.display = 'none';
      document.getElementById('trivia-input-area').style.display = 'none';
      input.value = '';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'trivia_game', action: 'win', to: activeChatId, from: myBappId }));
      }
    } else {
      input.value = '';
      const status = document.getElementById('trivia-status');
      const oldStatus = status.innerText;
      status.innerText = '❌ Wrong answer, try again!';
      setTimeout(() => { if(status.innerText === '❌ Wrong answer, try again!') status.innerText = oldStatus; }, 1500);
    }
  }

  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasTriviaHook) {
      socket.hasTriviaHook = true;
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trivia_game') {
            
            const game = document.getElementById('trivia-game');
            
            if (data.action === 'ready') {
              // Opponent clicked ready
              if (isPlayer1) {
                // We are Player 1, they just accepted. START THE MATCH!
                const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
                beginTriviaMatch(qObj.q, qObj.a);
                
                // Tell Player 2 to start with the same question
                socket.send(JSON.stringify({ 
                  type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                  question: qObj.q, answer: qObj.a 
                }));
              }
            } 
            else if (data.action === 'start') {
              // We are Player 2, Player 1 started the match.
              game.style.display = 'flex';
              beginTriviaMatch(data.question, data.answer);
            }
            else if (data.action === 'win') {
              triviaScores.them++;
              document.getElementById('score-them').innerText = triviaScores.them;
              document.getElementById('trivia-status').innerText = '🏆 Opponent won the round!';
              document.getElementById('trivia-question').style.display = 'none';
              document.getElementById('trivia-input-area').style.display = 'none';
              document.getElementById('trivia-ready-btn').style.display = 'block';
              currentTriviaAnswer = null;
              isGameActive = false;
            }
            return; 
          }
        } catch(e) {}
        if (originalHandler) originalHandler.call(socket, event);
      };
    }
  }, 1000);

  // We need Player 2 to see the Ready Button when they get the invite
  // Since we can't easily modify the server, we will use the 'new_message' hook 
  // to detect the invite string.
  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasInviteHook) {
      socket.hasInviteHook = true;
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.text === "🏆 I invited you to play Trivia!") {
            // Player 2 received the invite! Open the board with the Ready button
            const game = document.getElementById('trivia-game');
            game.style.display = 'flex';
            document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
            document.getElementById('trivia-question').style.display = 'none';
            document.getElementById('trivia-input-area').style.display = 'none';
            document.getElementById('trivia-ready-btn').style.display = 'block';
            isPlayer1 = false;
          }
        } catch(e) {}
        if (originalHandler) originalHandler.call(socket, event);
      };
    }
  }, 1000);
</script>
`;
html = html.replace(oldJSRegex, newJS);
fs.writeFileSync('index.html', html);
console.log("✅ Trivia Ready Handshake built!");
