const fs = require('fs');

// --- 1. PATCH SERVER.JS ---
let serverJs = fs.readFileSync('server.js', 'utf8');
const serverPatch = `
        // --- TRIVIA ROUTING ---
        if (data.type === 'trivia_game') {
            const targetClient = clients[data.chatId];
            if (targetClient && targetClient.readyState === 1) { // 1 = OPEN
                targetClient.send(JSON.stringify(data));
            }
            return;
        }
        // ----------------------
`;
// Inject right after the JSON parse
serverJs = serverJs.replace("const data = JSON.parse(message);", "const data = JSON.parse(message);\n" + serverPatch);
fs.writeFileSync('server.js', serverJs);

// --- 2. PATCH INDEX.HTML ---
let html = fs.readFileSync('index.html', 'utf8');

// A. Update the Game UI to include a Scoreboard
const oldUIRegex = /<div id="trivia-game"[\s\S]*?<\/div>\s*<\/div>/;
const newUI = `
<div id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>
    <span onclick="closeTrivia()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>

  <!-- SCOREBOARD -->
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
  
  <button id="trivia-start-btn" onclick="sendTriviaQuestion()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer;">Start Game</button>
  
  <div id="trivia-hint" style="font-size:12px; color:var(--text-muted); display:none;">Type your answer in the chat box below!</div>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// B. Update the Trivia JS Logic to handle scores and typing in the chat box
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

  function startTrivia() {
    document.getElementById('trivia-game').style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'Tap Start to send a question!';
    document.getElementById('trivia-start-btn').style.display = 'block';
    document.getElementById('trivia-hint').style.display = 'none';
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
    document.getElementById('trivia-hint').style.display = 'block';
    
    currentTriviaAnswer = qObj.a.toLowerCase().trim();
    isGameActive = true;

    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        chatId: activeChatId, 
        question: qObj.q,
        answer: currentTriviaAnswer
      }));
    }
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
            if (data.chatId !== activeChatId) return;
            
            const game = document.getElementById('trivia-game');
            
            if (data.action === 'start') {
              game.style.display = 'flex';
              document.getElementById('trivia-status').innerText = 'Type the answer in the chat to win!';
              document.getElementById('trivia-question').innerText = data.question;
              document.getElementById('trivia-question').style.display = 'block';
              document.getElementById('trivia-start-btn').style.display = 'none';
              document.getElementById('trivia-hint').style.display = 'block';
              currentTriviaAnswer = data.answer.toLowerCase().trim();
              isGameActive = true;
            } 
            else if (data.action === 'win') {
              triviaScores.them++;
              document.getElementById('score-them').innerText = triviaScores.them;
              document.getElementById('trivia-status').innerText = '🏆 Opponent won the round!';
              document.getElementById('trivia-start-btn').style.display = 'block';
              document.getElementById('trivia-question').style.display = 'none';
              document.getElementById('trivia-hint').style.display = 'none';
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

  // Hook into sendMessage to catch the answer
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
      document.getElementById('trivia-hint').style.display = 'none';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'trivia_game', 
          action: 'win', 
          chatId: activeChatId, 
          winner: 'Opponent'
        }));
      }
      return true;
    }
    return false;
  };
</script>
`;
html = html.replace(oldJSRegex, newJS);

// C. Ensure the sendMessage hook is active
if (!html.includes('window.checkTriviaAnswer(text)')) {
  html = html.replace('if (text === "") return;', `if (text === "") return;
    if (typeof window.checkTriviaAnswer === 'function' && window.checkTriviaAnswer(text)) {
      document.getElementById('chat-input').value = ''; 
      return; 
    }`);
}

fs.writeFileSync('index.html', html);
console.log("✅ Server routing added, Scoreboard added, Trivia fully functional!");
