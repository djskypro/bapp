const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Give every question an ID
html = html.replace(/const triviaQuestions = \[[\s\S]*?\];/, `
const triviaQuestions = [
    { id: 1, q: "What is the capital of France?", a: "paris" },
    { id: 2, q: "How many planets are in our solar system?", a: "8" },
    { id: 3, q: "What is 5 + 7?", a: "12" },
    { id: 4, q: "Who painted the Mona Lisa?", a: "leonardo da vinci" },
    { id: 5, q: "What is the largest mammal?", a: "blue whale" }
  ];
`);

// 2. Insert the AI Matcher function if it doesn't exist
if (!html.includes('function isAnswerCorrect')) {
    html = html.replace('function submitTriviaAnswer', `
  function isAnswerCorrect(userText, correctAnswer) {
    if (!userText || !correctAnswer) return false;
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUser === cleanCorrect) return true;
    if (cleanUser.length > 2 && cleanCorrect.includes(cleanUser)) return true;
    if (cleanCorrect.length > 2 && cleanUser.includes(cleanCorrect)) return true;
    return false;
  }

  function submitTriviaAnswer`);
}

// 3. Update beginTriviaMatch to use the AI matcher
html = html.replace(
    "answer.toLowerCase().trim() === currentTriviaAnswer",
    "isAnswerCorrect(answer, currentTriviaAnswer)"
);

// 4. Player 1 generates the question and sends the ID (not the answer)
const oldAccept = `if (data.action === 'accept') {
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
const newAccept = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              
              // Send the QUESTION ID to Player 2
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                qId: qObj.id
              }));
              
              // Start the match on Player 1's screen
              game.style.display = 'flex';
              beginTriviaMatch(qObj.q, qObj.a);
            }`;
html = html.replace(oldAccept, newAccept);

// 5. Player 2 receives the ID and looks up the question locally
const oldStart = `else if (data.action === 'start') {
              // We are Player 2, Player 1 started the match.
              game.style.display = 'flex';
              beginTriviaMatch(data.question, data.answer);
            }`;
const newStart = `else if (data.action === 'start') {
              // We are Player 2, Player 1 started the match.
              game.style.display = 'flex';
              
              // Look up the question using the ID sent by Player 1
              const qObj = triviaQuestions.find(q => q.id === data.qId);
              if (qObj) {
                 beginTriviaMatch(qObj.q, qObj.a);
              } else {
                 // Fallback if ID is missing
                 beginTriviaMatch(data.question, data.answer);
              }
            }`;
html = html.replace(oldStart, newStart);

// 6. Remove the 2-chance 'null' bug by ensuring the correct answer shows
html = html.replace(
    "status.innerText = '❌ Out of chances! The answer was: ' + currentTriviaAnswer;",
    "status.innerText = '❌ Out of chances! The answer was: ' + (currentTriviaAnswer || 'Unknown');"
);

fs.writeFileSync('index.html', html);
console.log("✅ Hardcoded IDs and AI Brain installed! No more 'null' answers.");
