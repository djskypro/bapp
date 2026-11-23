const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove any old Trivia script blocks
html = html.replace(/<script>\s*const triviaQuestions[\s\S]*?<\/script>/g, '');

// Add the new, clean script block right before </body>
const newScript = `
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

  function startTrivia() {
    // 1. Send the invite message
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const inviteMsg = "🏆 I invited you to play Trivia!";
      const payload = {
        type: 'send_message',
        to: activeChatId,
        from: myBappId,
        text: inviteMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      if (typeof appendMessage === 'function') {
        appendMessage(inviteMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }

    // 2. Open the game board for Player 1
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
    
    // Update UI for Player 1
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to answer...';
    document.getElementById('trivia-question').innerText = qObj.q;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-start-btn').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    
    currentTriviaAnswer = qObj.a.toLowerCase().trim();
    isGameActive = true;

    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      // Send the game signal
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        to: activeChatId, 
        from: myBappId,
        question: qObj.q,
        answer: currentTriviaAnswer
      }));
      
      // Send the chat bubble
      const gameMsg = "🏆 TRIVIA: " + qObj.q;
      const payload = {
        type: 'send_message',
        to: activeChatId,
        from: myBappId,
        text: gameMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      if (typeof appendMessage === 'function') {
        appendMessage(gameMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
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
      document.getElementById('trivia-start-btn').style.display = 'block';
      document.getElementById('trivia-question').style.display = 'none';
      document.getElementById('trivia-input-area').style.display = 'none';
      input.value = '';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'trivia_game', action: 'win', to: activeChatId, from: myBappId 
        }));
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
          if (data.type === 'trivia_game' && data.from === activeChatId) {
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
</script>
`;
html = html.replace('</body>', newScript + '</body>');
fs.writeFileSync('index.html', html);
console.log("✅ Trivia completely rebuilt and clean!");
