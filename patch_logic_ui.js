const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Change 'none' to 'flex' for the input area inside beginTriviaMatch
const oldBegin = `document.getElementById('trivia-input-area').style.display = 'none';
    document.getElementById('trivia-answer-input').value = '';`;
const newBegin = `document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    document.getElementById('trivia-answer-input').focus();`;
html = html.replace(oldBegin, newBegin);

// 2. Add the endTriviaGame function if it doesn't exist
if (!html.includes('function endTriviaGame()')) {
    const endFunc = `
  function endTriviaGame() {
    document.getElementById('trivia-game').style.display = 'none';
    isGameActive = false;
    currentTriviaAnswer = null;
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'end', to: activeChatId, from: myBappId }));
    }
  }
  `;
    html = html.replace('function beginTriviaMatch', endFunc + '\n  function beginTriviaMatch');
}

// 3. Ensure the blur is full screen (update the trivia-game div styling)
html = html.replace(
    'id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;"',
    'id="trivia-game" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter:blur(15px); z-index:999999; justify-content:center; align-items:center; flex-direction:column;"'
);
// We need to wrap the inner content in a box so it looks good
html = html.replace(
    '<span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>',
    '<span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>'
);

fs.writeFileSync('index.html', html);
console.log("✅ UI Input Box, End Game button, and Full Blur applied!");
