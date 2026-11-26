
  let myRPSChoice = null;
  let opponentRPSChoice = null;
  let rpsScores = { you: 0, them: 0 };

  function openRPS() {
    document.getElementById('rps-game').style.display = 'flex';
    document.getElementById('rps-status').innerText = 'Choose your move!';
    myRPSChoice = null;
    opponentRPSChoice = null;
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function closeRPS() {
    document.getElementById('rps-game').style.display = 'none';
  }

  function pickRPS(choice) {
    myRPSChoice = choice;
    setTimeout(checkRPSWinner, 100);
    document.getElementById('rps-status').innerText = 'Waiting for opponent...';
    
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      // Send the move to the server
      socket.send(JSON.stringify({ 
        type: 'rps_game', action: 'move', to: activeChatId, from: myBappId, move: choice 
      }));
    }
    
    // Drop a chat message
    socket.send(JSON.stringify(payload));
    if (typeof appendMessage === 'function') {
      appendMessage(msg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
      if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
    }
  }

  function checkRPSWinner() {
    if (!myRPSChoice || !opponentRPSChoice) return;
    
    const status = document.getElementById('rps-status');
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    status.innerText = 'You: ' + emojis[myRPSChoice] + ' vs Opponent: ' + emojis[opponentRPSChoice] + '\n';
    
    if (myRPSChoice === opponentRPSChoice) {
      status.innerText += 'It\'s a tie! 🤝';
    } else if (
      (myRPSChoice === 'rock' && opponentRPSChoice === 'scissors') ||
      (myRPSChoice === 'paper' && opponentRPSChoice === 'rock') ||
      (myRPSChoice === 'scissors' && opponentRPSChoice === 'paper')
    ) {
      status.innerText += '🏆 You Win!';
      rpsScores.you++;
      document.getElementById('rps-score-you').innerText = rpsScores.you;
    } else {
      status.innerText += '😔 You Lose!';
      rpsScores.them++;
      document.getElementById('rps-score-them').innerText = rpsScores.them;
    }
    
    myRPSChoice = null;
    opponentRPSChoice = null;
  }

  // Safe WebSocket hook
  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasRPSHook) {
      socket.hasRPSHook = true;
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'rps_game') {
            if (data.action === 'move') {
              opponentRPSChoice = data.move;
              setTimeout(checkRPSWinner, 100);
              document.getElementById('rps-game').style.display = 'flex';
              document.getElementById('rps-status').innerText = 'Opponent moved! Your turn.';
            }
            return; 
          }
        } catch(e) {}
        if (originalHandler) originalHandler.call(socket, event);
      };
    }
  }, 1000);
