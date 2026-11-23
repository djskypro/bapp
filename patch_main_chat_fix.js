const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the popup's input box completely (since we are using the main chat box)
html = html.replace("document.getElementById('trivia-input-area').style.display = 'flex';", "document.getElementById('trivia-input-area').style.display = 'none';");

// 2. Rewrite checkTriviaAnswer to handle the text from the main chat
const oldCheckRegex = /window\.checkTriviaAnswer = function\(msgText\) \{[\s\S]*?return false;\s*\};/;
const newCheck = `window.checkTriviaAnswer = function(msgText) {
    if (typeof isGameActive === 'undefined' || !isGameActive || !currentTriviaAnswer) return false;
    
    if (msgText.toLowerCase().trim() === currentTriviaAnswer) {
      currentTriviaAnswer = null;
      isGameActive = false;
      
      triviaScores.you++;
      const scoreYou = document.getElementById('score-you');
      if (scoreYou) scoreYou.innerText = triviaScores.you;
      
      const status = document.getElementById('trivia-status');
      if (status) status.innerText = '🏆 You won the round!';
      
      document.getElementById('trivia-question').style.display = 'none';
      document.getElementById('trivia-ready-btn').style.display = 'block';
      
      if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'trivia_game', action: 'win', to: activeChatId, from: myBappId 
        }));
      }
      return true;
    } else {
      // Wrong answer
      const status = document.getElementById('trivia-status');
      if (status) {
         const oldStatus = status.innerText;
         status.innerText = '❌ Wrong answer, try again!';
         setTimeout(() => { if(status.innerText === '❌ Wrong answer, try again!') status.innerText = oldStatus; }, 1500);
      }
      return true; // Return true so the message doesn't send to the chat
    }
  };`;
html = html.replace(oldCheckRegex, newCheck);

fs.writeFileSync('index.html', html);
console.log("✅ Main chat input wired to Trivia!");
