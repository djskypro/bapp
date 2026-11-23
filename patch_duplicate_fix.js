const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the broken block with all the duplicated 'accept' statements
const brokenBlockRegex = /if \(data\.action === 'accept'\) \{[\s\S]*?else if \(data\.action === 'ready'\) \{/;

// The clean replacement
const cleanBlock = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              beginTriviaMatch(qObj.q, qObj.a);
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                question: qObj.q, answer: qObj.a 
              }));
            }
            else if (data.action === 'ready') {`;

if (html.match(brokenBlockRegex)) {
    html = html.replace(brokenBlockRegex, cleanBlock);
    fs.writeFileSync('index.html', html);
    console.log("✅ Duplicate code removed! Logic is clean.");
} else {
    console.log("❌ Could not find the broken block.");
}
