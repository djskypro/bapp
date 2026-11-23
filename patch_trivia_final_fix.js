const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix acceptTriviaMatch to send 'accept' if not Player 1
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

// 2. Update the receiver logic so Player 1 gets the 'accept' and actually shows the game
const oldReceiver = `if (data.action === 'ready') {
              // Opponent clicked ready
              if (isPlayer1) {
                // We are Player 1, they just accepted. START THE MATCH!
                const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
                beginTriviaMatch(qObj.q, qObj.a);
                
                // Tell Player 2 to start with the same question
                socket.send(JSON.stringify({ 
                  type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                  question: qObj.q, answer: qObj.a 
                }));
              } else {
                // We are Player 2, Player 1 is ready. Show the popup!
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent is ready! Are you ready?';
                document.getElementById('trivia-ready-btn').style.display = 'block';
              }
            }`;

const newReceiver = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
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
            }`;
html = html.replace(oldReceiver, newReceiver);

fs.writeFileSync('index.html', html);
console.log("✅ Trivia handshake fixed!");
