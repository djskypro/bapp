const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the button to the side menu (right above Shared Listening)
const menuButton = `
    <div onclick="startTrivia()" style="display:flex; align-items:center; gap:15px; padding:15px; background:var(--search-bg); border-radius:15px; cursor:pointer; margin-top:10px;">
      <span style="font-size:20px;">🏆</span>
      <span style="font-size:16px; font-weight:500;">Trivia Quiz</span>
    </div>
`;
html = html.replace('<div onclick="openSharedListening()"', menuButton + '<div onclick="openSharedListening()"');

// 2. Add the Trivia Game UI
const gameUI = `
<!-- TRIVIA GAME UI -->
<div id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>
    <span onclick="closeTrivia()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>
  
  <div id="trivia-status" style="font-size:14px; color:#aaa;">Waiting to start...</div>
  
  <div id="trivia-question" style="font-size:18px; font-weight:bold; color:white; margin:15px 0; display:none;"></div>
  
  <button id="trivia-start-btn" onclick="sendTriviaQuestion()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer;">Start Game</button>
</div>
`;
html = html.replace('</body>', gameUI + '</body>');

// 3. Add Trivia Logic safely
const triviaJS = `
<script>
  const triviaQuestions = [
    { q: "What is the capital of France?", a: "paris" },
    { q: "How many planets are in our solar system?", a: "8" },
    { q: "What is 5 + 7?", a: "12" },
    { q: "Who painted the Mona Lisa?", a: "leonardo da vinci" },
    { q: "What is the largest mammal?", a: "blue whale" }
  ];
  
  let currentTriviaAnswer = null;

  function startTrivia() {
    document.getElementById('trivia-game').style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Tap Start to send a question to the chat!';
    document.getElementById('trivia-start-btn').style.display = 'block';
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }

  function closeTrivia() {
    document.getElementById('trivia-game').style.display = 'none';
  }

  function sendTriviaQuestion() {
    const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to answer...';
    document.getElementById('trivia-question').innerText = qObj.q;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-start-btn').style.display = 'none';
    
    // Send to WebSocket
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        chatId: activeChatId, 
        question: qObj.q,
        answer: qObj.a 
      }));
    }
  }

  // Safe WebSocket hook for Trivia
  setInterval(() => {
    if (typeof socket !== 'undefined' && socket && !socket.hasTriviaHook) {
      socket.hasTriviaHook = true;
      const originalHandler = socket.onmessage;
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trivia_game') {
            if (data.chatId !== activeChatId) return;
            
            const game = document.getElementById('trivia-game');
            
            if (data.action === 'start') {
              // Open game if received an invite
              game.style.display = 'flex';
              document.getElementById('trivia-status').innerText = 'Type the answer in the chat to win!';
              document.getElementById('trivia-question').innerText = data.question;
              document.getElementById('trivia-question').style.display = 'block';
              document.getElementById('trivia-start-btn').style.display = 'none';
              currentTriviaAnswer = data.answer.toLowerCase();
            } 
            else if (data.action === 'win') {
              document.getElementById('trivia-status').innerText = '🏆 ' + data.winner + ' won the round!';
              document.getElementById('trivia-start-btn').style.display = 'block';
              document.getElementById('trivia-question').style.display = 'none';
              currentTriviaAnswer = null;
            }
            return; 
          }
        } catch(e) {}
        
        if (originalHandler) originalHandler.call(socket, event);
      };
    }
  }, 1000);

  // Hook into the send message function to check for the answer
  window.checkTriviaAnswer = function(msgText) {
    if (!currentTriviaAnswer) return false;
    if (msgText.toLowerCase().trim() === currentTriviaAnswer) {
      currentTriviaAnswer = null;
      
      // We won!
      document.getElementById('trivia-status').innerText = '🏆 You won the round!';
      document.getElementById('trivia-start-btn').style.display = 'block';
      document.getElementById('trivia-question').style.display = 'none';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'trivia_game', 
          action: 'win', 
          chatId: activeChatId, 
          winner: 'You' 
        }));
      }
      return true;
    }
    return false;
  };
</script>
`;
html = html.replace('</body>', triviaJS + '</body>');

fs.writeFileSync('index.html', html);
console.log("✅ Trivia UI and Logic added!");
