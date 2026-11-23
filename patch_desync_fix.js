const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the entire Trivia Game UI to include Scoreboard and Input Box
const oldUIRegex = /<div id="trivia-game"[\s\S]*?<\/div>\s*<\/div>/;
const newUI = `
<div id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>
    <span onclick="closeTrivia()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>

  <!-- SCOREBOARD -->
  <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; margin-bottom:5px;">
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
  
  <!-- INPUT BOX UNDER QUESTION -->
  <div id="trivia-input-area" style="display:none; gap:10px; margin-top:5px;">
    <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; outline:none;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
    <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 15px; border-radius:12px; font-weight:bold; cursor:pointer;">Send</button>
  </div>

  <!-- BUTTONS -->
  <div id="trivia-actions" style="display:flex; gap:10px; margin-top:5px; justify-content:center;">
    <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="flex:1; background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer;">✅ I'm Ready</button>
    <button id="trivia-not-ready-btn" onclick="declineTriviaMatch()" style="flex:1; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border:1px solid #e74c3c; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer;">❌ Not Ready</button>
  </div>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// 2. Fix the loop by ensuring Player 2 sends 'accept'
const oldAccept = `type: 'trivia_game', action: 'ready', to: activeChatId, from: myBappId`;
const newAccept = `type: 'trivia_game', action: isPlayer1 ? 'ready' : 'accept', to: activeChatId, from: myBappId`;
html = html.replace(oldAccept, newAccept);

// 3. Fix the Receiver logic to start the game properly for both
const oldReceiver = /if \(data\.action === 'ready'\) \{[\s\S]*?document\.getElementById\('trivia-ready-btn'\)\.style\.display = 'block';\s*\}\s*\}/;
const newReceiver = `if (data.action === 'ready') {
              if (!isPlayer1) {
                // We are Player 2, Player 1 is ready. Show the accept popup!
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent is ready! Are you ready?';
                document.getElementById('trivia-ready-btn').style.display = 'block';
                document.getElementById('trivia-not-ready-btn').style.display = 'block';
              }
            }
            else if (data.action === 'accept') {
              // We are Player 1, Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, question: qObj.q, answer: qObj.a }));
            }`;
html = html.replace(oldReceiver, newReceiver);

// 4. Ensure beginTriviaMatch hides the buttons and shows the input box
const oldBegin = /function beginTriviaMatch\(question, answer\) \{[\s\S]*?\}/;
const newBegin = `function beginTriviaMatch(question, answer) {
    currentTriviaQuestion = question;
    currentTriviaAnswer = answer.toLowerCase().trim();
    isGameActive = true;
    
    document.getElementById('trivia-status').innerText = 'Type your answer below!';
    document.getElementById('trivia-question').innerText = question;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    
    // Hide the ready buttons
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';

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
  }`;
html = html.replace(oldBegin, newBegin);

fs.writeFileSync('index.html', html);
console.log("✅ Desync fixed! UI restored, loop broken.");
