const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the 'accept' block to ensure Player 1 updates their own screen too
const oldAcceptBlock = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
            }`;

const newAcceptBlock = `if (data.action === 'accept') {
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
            }`;

html = html.replace(oldAcceptBlock, newAcceptBlock);

fs.writeFileSync('index.html', html);
console.log("✅ Fixed! Both players will now see the exact same question.");
