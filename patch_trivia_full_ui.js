const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the entire Trivia UI with the full-screen blurred version
const oldUIRegex = /<div id="trivia-game"[\s\S]*?<\/div>\s*<\/div>/;
const newUI = `
<div id="trivia-game" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); z-index:999999; justify-content:center; align-items:center; flex-direction:column;">
  
  <div style="width:90%; max-width:400px; background:rgba(20,20,20,0.9); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; display:flex; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
    
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="color:var(--primary); font-weight:bold; font-size:18px;">🏆 Trivia Quiz</span>
      <span onclick="endTriviaGame()" style="cursor:pointer; font-size:14px; color:#e74c3c; background:rgba(231,76,60,0.2); padding:5px 10px; border-radius:10px;">End Game</span>
    </div>

    <!-- SCOREBOARD -->
    <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.5); padding:15px; border-radius:15px; border:1px solid rgba(255,255,255,0.1);">
      <div style="text-align:center; flex:1;">
        <div style="font-size:12px; color:#aaa;">You</div>
        <div id="score-you" style="font-size:24px; font-weight:bold; color:var(--primary);">0</div>
      </div>
      <div style="width:1px; background:rgba(255,255,255,0.2);"></div>
      <div style="text-align:center; flex:1;">
        <div style="font-size:12px; color:#aaa;">Opponent</div>
        <div id="score-them" style="font-size:24px; font-weight:bold; color:white;">0</div>
      </div>
    </div>
    
    <div id="trivia-status" style="font-size:14px; color:var(--primary); margin-top:10px;">Waiting to start...</div>
    
    <div id="trivia-question" style="font-size:20px; font-weight:bold; color:white; margin:20px 0; display:none; line-height:1.4;"></div>
    
    <!-- ANSWER BOX -->
    <div id="trivia-input-area" style="display:none; gap:10px; margin-top:10px;">
      <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:15px; border-radius:15px; color:white; outline:none; font-size:16px;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
      <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 20px; border-radius:15px; font-weight:bold; cursor:pointer; font-size:16px;">Send</button>
    </div>

    <!-- READY BUTTONS -->
    <div id="trivia-actions" style="display:flex; gap:10px; margin-top:15px; justify-content:center;">
      <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="flex:1; background:var(--primary); color:black; border:none; padding:15px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer;">✅ I'm Ready</button>
      <button id="trivia-not-ready-btn" onclick="declineTriviaMatch()" style="flex:1; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border:1px solid #e74c3c; padding:15px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer;">❌ Not Ready</button>
    </div>

  </div>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// 2. Fix the JS to handle End Game and the new input box
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
  let triviaScores = { you: 0, them: 0 };
  let isGameActive = false;
  let isPlayer1 = false;

  function startTrivia() {
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
    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';
    
    isPlayer1 = true;
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function endTriviaGame() {
    document.getElementById('trivia-game').style.display = 'none';
    isGameActive = false;
    currentTriviaAnswer = null;
  }

  function acceptTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to accept...';
    
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', action: isPlayer1 ? 'ready' : 'accept', to: activeChatId, from: myBappId
      }));
    }
  }

  function declineTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'You declined the game.';
    setTimeout(endTriviaGame, 1500);
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'decline', to: activeChatId, from: myBappId }));
    }
  }

  function beginTriviaMatch(question, answer) {
    currentTriviaAnswer = answer.toLowerCase().trim();
    isGameActive = true;
    
    document.getElementById('trivia-status').innerText = 'Type your answer below!';
    document.getElementById('trivia-question').innerText = question;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    
    // Focus the input box automatically
    setTimeout(() => document.getElementById('trivia-answer-input').focus(), 100);
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
            
            if (data.action === 'decline') {
              document.getElementById('trivia-status').innerText = 'Opponent declined the game. 😔';
              setTimeout(endTriviaGame, 2000);
              return;
            }

            const game = document.getElementById('trivia-game');
            
            if (data.action === 'ready') {
              if (!isPlayer1) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent is ready! Are you ready?';
                document.getElementById('trivia-ready-btn').style.display = 'block';
                document.getElementById('trivia-not-ready-btn').style.display = 'block';
              }
            }
            else if (data.action === 'accept') {
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
            }
            else if (data.action === 'start') {
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
</script>
`;
html = html.replace(oldJSRegex, newJS);

// 3. Remove the check from the main sendMessage so it doesn't interfere
html = html.replace(/\/\/ --- TRIVIA CHECK ---[\s\S]*?\/\/ --------------------/g, '');

fs.writeFileSync('index.html', html);
console.log("✅ Full Trivia UI with Blur and Input Box applied!");
