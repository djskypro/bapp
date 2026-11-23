const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the exact block and add the else statement
const target = `if (data.action === 'ready') {
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
              }`;

const replacement = `if (data.action === 'ready') {
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
              }`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('index.html', html);
    console.log("✅ Safe patch applied successfully!");
} else {
    console.log("❌ Could not find the exact code block. The file was NOT changed.");
}
