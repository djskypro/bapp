
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
  
  function sanitizeText(str) {
    if (!str) return "";
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
  }
  
  let isGameActive = false;
  let triviaChances = 2;
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
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    
    const readyBtn = document.getElementById('trivia-ready-btn');
    if(readyBtn) {
        readyBtn.style.display = 'block';
        readyBtn.innerText = "✅ I'm Ready";
        readyBtn.setAttribute('onclick', 'acceptTriviaMatch()');
    }
    
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
        type: 'trivia_game', action: (isPlayer1 ? 'ready' : 'accept'), to: activeChatId, from: myBappId 
      }));
    }

    if (isPlayer1) {
      // Player 1 is ready, now we must ask Player 2
      // We do this by setting up the opponent's screen to show the Ready button
    }
  }

  
  function endTriviaGame() {
    document.getElementById('trivia-game').style.display = 'none';
    isGameActive = false;
    currentTriviaAnswer = null;
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'end', to: activeChatId, from: myBappId }));
    }
  }
    document.getElementById('trivia-status').innerText = 'Type your answer below! (Ans: ' + currentTriviaAnswer + ')';
    console.log('Answer saved as: ', currentTriviaAnswer);
  function beginTriviaMatch(question, answer) {
    triviaChances = 2;
    currentTriviaQuestion = question;
    currentTriviaAnswer = answer.toLowerCase().trim();
    isGameActive = true;
    
    document.getElementById('trivia-status').innerText = 'Type your answer below!';
    document.getElementById('trivia-question').innerText = question;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-input-area').style.display = 'flex';
    const inputBox = document.getElementById('trivia-answer-input');
    if(inputBox) { inputBox.disabled = false; inputBox.style.opacity = '1'; }
    document.getElementById('trivia-answer-input').value = '';
    document.getElementById('trivia-answer-input').focus();
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

  function submitTriviaAnswer(forcedText = null) {
    const input = document.getElementById('trivia-answer-input');
    const answer = forcedText || (input ? input.value.trim() : '');
    if (!answer) return;

    console.log('DEBUG TRIVIA: You typed:', answer.toLowerCase(), '| Correct is:', currentTriviaAnswer);
    if (isGameActive && currentTriviaAnswer && answer.toLowerCase().replace(/[^a-z0-9]/g, "") === currentTriviaAnswer.toLowerCase().replace(/[^a-z0-9]/g, "")) {
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
      triviaChances--;
      const status = document.getElementById('trivia-status');
      
      if (triviaChances > 0) {
        status.innerText = '❌ Wrong! You have ' + triviaChances + ' chance(s) left.';
        setTimeout(() => { if(status.innerText.includes('Wrong!')) status.innerText = 'Type your answer below!'; }, 2000);
      } else {
        // Out of chances
        isGameActive = false;
        status.innerText = '❌ Out of chances! The answer was: ' + currentTriviaAnswer;
        input.disabled = true;
        input.style.opacity = '0.5';
        document.getElementById('trivia-question').style.display = 'none';
      }
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
            
            if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              
              // Send the question to Player 2
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
              
              // Start the match on Player 1's screen using the same data
              game.style.display = 'flex';
              beginTriviaMatch(qObj.q, qObj.a);
            }
            else if (data.action === 'ready') {
              // Opponent clicked ready
              if (isPlayer1) {
                // Player 1 just clicked ready, do nothing, wait for accept
              } else {
                // We are Player 2, Player 1 is ready. Show the popup!
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent is ready! Are you ready?';
                document.getElementById('trivia-ready-btn').style.display = 'block';
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
