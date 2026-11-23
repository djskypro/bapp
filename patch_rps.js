const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the RPS UI right before </body>
const rpsUI = `
<!-- RPS GAME UI -->
<div id="rps-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:320px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:20px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">✊ Rock, Paper, Scissors</span>
    <span onclick="closeRPS()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>
  <div id="rps-status" style="font-size:14px; color:#aaa;">Choose your move!</div>
  
  <div style="display:flex; justify-content:space-around; margin-top:10px;">
    <button onclick="pickRPS('rock')" style="font-size:40px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:15px; border-radius:20px; cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">🪨</button>
    <button onclick="pickRPS('paper')" style="font-size:40px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:15px; border-radius:20px; cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">📄</button>
    <button onclick="pickRPS('scissors')" style="font-size:40px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:15px; border-radius:20px; cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✂️</button>
  </div>
</div>
`;
html = html.replace('</body>', rpsUI + '</body>');

// 2. Add the RPS Logic
const rpsJS = `
<script>
  let myRPSChoice = null;
  let opponentRPSChoice = null;

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
    document.getElementById('rps-status').innerText = 'Waiting for opponent...';
    
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      // Send the move to the server
      socket.send(JSON.stringify({ 
        type: 'rps_game', action: 'move', to: activeChatId, from: myBappId, move: choice 
      }));
    }
    
    // Drop a chat message
    const msg = "✊ I made my move in Rock, Paper, Scissors! Your turn.";
    const payload = {
      type: 'send_message', to: activeChatId, from: myBappId, text: msg,
      timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
    };
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
    
    status.innerText = 'You: ' + emojis[myRPSChoice] + ' vs Opponent: ' + emojis[opponentRPSChoice] + '\\n';
    
    if (myRPSChoice === opponentRPSChoice) {
      status.innerText += 'It\\'s a tie! 🤝';
    } else if (
      (myRPSChoice === 'rock' && opponentRPSChoice === 'scissors') ||
      (myRPSChoice === 'paper' && opponentRPSChoice === 'rock') ||
      (myRPSChoice === 'scissors' && opponentRPSChoice === 'paper')
    ) {
      status.innerText += '🏆 You Win!';
    } else {
      status.innerText += '😔 You Lose!';
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
</script>
`;
html = html.replace('</body>', rpsJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ RPS Game added!");
