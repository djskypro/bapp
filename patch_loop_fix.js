const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix acceptTriviaMatch to send 'accept' if we are Player 2
const oldAccept = `if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', action: 'ready', to: activeChatId, from: myBappId
      }));
    }`;
const newAccept = `if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'trivia_game', action: isPlayer1 ? 'ready' : 'accept', to: activeChatId, from: myBappId
      }));
    }`;
html = html.replace(oldAccept, newAccept);

// 2. Add the listener for 'accept' on Player 1's side
const oldReadyBlock = `if (data.action === 'ready') {`;
const newReadyBlock = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
            }
            else if (data.action === 'ready') {`;
html = html.replace(oldReadyBlock, newReadyBlock);

fs.writeFileSync('index.html', html);
console.log("✅ Infinite loop fixed! Player 2 now sends 'accept'.");
