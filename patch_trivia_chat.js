const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Ensure the UI has the input box exactly where we want it (under the question)
// We will just overwrite the whole trivia-game div to be perfectly clean.
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
  
  <!-- INPUT BOX UNDER THE QUESTION -->
  <div id="trivia-input-area" style="display:none; gap:10px; margin-top:10px;">
    <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; outline:none;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
    <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 15px; border-radius:12px; font-weight:bold; cursor:pointer;">Send</button>
  </div>

  <button id="trivia-start-btn" onclick="sendTriviaQuestion()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer;">Start Game</button>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// 2. Update sendTriviaQuestion to ALSO send a normal chat bubble
const oldSend = `function sendTriviaQuestion() {
    const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to answer...';
    document.getElementById('trivia-question').innerText = qObj.q;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-start-btn').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    
    currentTriviaAnswer = qObj.a.toLowerCase().trim();
    isGameActive = true;

    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        to: activeChatId, 
        from: myBappId,
        question: qObj.q,
        answer: currentTriviaAnswer
      }));
    }
  }`;

const newSend = `function sendTriviaQuestion() {
    const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to answer...';
    document.getElementById('trivia-question').innerText = qObj.q;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-start-btn').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    
    currentTriviaAnswer = qObj.a.toLowerCase().trim();
    isGameActive = true;

    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      // 1. Send the game payload
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        to: activeChatId, 
        from: myBappId,
        question: qObj.q,
        answer: currentTriviaAnswer
      }));

      // 2. ALSO send a normal chat message so it shows in the chat history for both
      const gameMsg = "🏆 TRIVIA: " + qObj.q;
      const payload = {
        type: 'message',
        to: activeChatId,
        from: myBappId,
        text: gameMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      
      // Add it to your own screen immediately
      if (typeof appendMessage === 'function') {
        appendMessage(gameMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
  }`;

html = html.replace(oldSend, newSend);
fs.writeFileSync('index.html', html);
console.log("✅ Trivia now sends a chat bubble + has input box!");
