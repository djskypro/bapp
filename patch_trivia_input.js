const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the input field and submit button to the Trivia UI
const oldUI = `<div id="trivia-hint" style="font-size:12px; color:var(--text-muted); display:none;">Type your answer in the chat box below!</div>`;
const newUI = `
  <div id="trivia-input-area" style="display:none; gap:10px; margin-top:10px;">
    <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; outline:none;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
    <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 15px; border-radius:12px; font-weight:bold; cursor:pointer;">Send</button>
  </div>`;
html = html.replace(oldUI, newUI);

// 2. Update the JS to show the input field and handle the submission
const oldJS = /function startTrivia\(\) \{[\s\S]*?<\/script>/;
const newJS = `function startTrivia() {
    document.getElementById('trivia-game').style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Tap Start to send a question!';
    document.getElementById('trivia-start-btn').style.display = 'block';
    document.getElementById('trivia-input-area').style.display = 'none';
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function closeTrivia() {
    document.getElementById('trivia-game').style.display = 'none';
    isGameActive = false;
    currentTriviaAnswer = null;
  }

  function sendTriviaQuestion() {
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
  }

  function submitTriviaAnswer() {
    const input = document.getElementById('trivia-answer-input');
    const answer = input.value.trim();
    if (!answer) return;

    if (typeof window.checkTriviaAnswer === 'function') {
      if (window.checkTriviaAnswer(answer)) {
        input.value = ''; // Clear input on win
        return;
      }
    }
    // If wrong, clear input and show wrong message briefly
    input.value = '';
    const status = document.getElementById('trivia-status');
    const oldStatus = status.innerText;
    status.innerText = '❌ Wrong answer, try again!';
    setTimeout(() => { if(status.innerText === '❌ Wrong answer, try again!') status.innerText = oldStatus; }, 1500);
  }

  // Safe WebSocket hook
  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasTriviaHook) {
      socket.hasTriviaHook = true;
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trivia_game') {
            if (data.from !== activeChatId) return;
            
            const game = document.getElementById('trivia-game');
            
            if (data.action === 'start') {
              game.style.display = 'flex';
              document.getElementById('trivia-status').innerText = 'Type your answer below!';
              document.getElementById('trivia-question').innerText = data.question;
              document.getElementById('trivia-question').style.display = 'block';
              document.getElementById('trivia-start-btn').style.display = 'none';
              document.getElementById('trivia-input-area').style.display = 'flex';
              document.getElementById('trivia-answer-input').value = '';
              currentTriviaAnswer = data.answer.toLowerCase().trim();
              isGameActive = true;
            } 
            else if (data.action === 'win') {
              triviaScores.them++;
              document.getElementById('score-them').innerText = triviaScores.them;
              document.getElementById('trivia-status').innerText = '🏆 Opponent won the round!';
              document.getElementById('trivia-start-btn').style.display = 'block';
              document.getElementById('trivia-question').style.display = 'none';
              document.getElementById('trivia-input-area').style.display = 'none';
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

  window.checkTriviaAnswer = function(msgText) {
    if (!isGameActive || !currentTriviaAnswer) return false;
    
    if (msgText.toLowerCase().trim() === currentTriviaAnswer) {
      currentTriviaAnswer = null;
      isGameActive = false;
      
      triviaScores.you++;
      document.getElementById('score-you').innerText = triviaScores.you;
      document.getElementById('trivia-status').innerText = '🏆 You won the round!';
      document.getElementById('trivia-start-btn').style.display = 'block';
      document.getElementById('trivia-question').style.display = 'none';
      document.getElementById('trivia-input-area').style.display = 'none';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'trivia_game', 
          action: 'win', 
          to: activeChatId, 
          from: myBappId,
          winner: 'Opponent'
        }));
      }
      return true;
    }
    return false;
  };
</script>`;
html = html.replace(oldJS, newJS);
fs.writeFileSync('index.html', html);
console.log("✅ Trivia Input Box added and wired up!");
