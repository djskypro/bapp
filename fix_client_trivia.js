const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Give each question a unique ID
const oldQuestions = /const triviaQuestions = \[[\s\S]*?\];/;
const newQuestions = `const triviaQuestions = [
    { id: 1, q: "What is the capital of France?", a: "paris" },
    { id: 2, q: "How many planets are in our solar system?", a: "8" },
    { id: 3, q: "What is 5 + 7?", a: "12" },
    { id: 4, q: "Who painted the Mona Lisa?", a: "leonardo da vinci" },
    { id: 5, q: "What is the largest mammal?", a: "blue whale" }
  ];`;
html = html.replace(oldQuestions, newQuestions);

// 2. Fix the 'accept' block (Player 1 generates ID and sends it)
const oldAcceptBlock = /if \(data\.action === 'accept'\) \{[\s\S]*?beginTriviaMatch\(qObj\.q, qObj\.a\);\s*\}/;
const newAcceptBlock = `if (data.action === 'accept') {
              // Player 2 accepted. Start the match!
              const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
              
              // Send ONLY the ID to Player 2
              socket.send(JSON.stringify({ 
                type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId, 
                questionId: qObj.id 
              }));
              
              // Start match on Player 1's screen
              game.style.display = 'flex';
              beginTriviaMatch(qObj.q, qObj.a);
            }`;
html = html.replace(oldAcceptBlock, newAcceptBlock);

// 3. Fix the 'start' block (Player 2 receives ID and looks up the answer locally)
const oldStartBlock = /else if \(data\.action === 'start'\) \{[\s\S]*?beginTriviaMatch\(data\.question, data\.answer\);\s*\}/;
const newStartBlock = `else if (data.action === 'start') {
              // Player 2 received the ID. Look it up locally!
              game.style.display = 'flex';
              const qObj = triviaQuestions.find(q => q.id === data.questionId);
              if (qObj) {
                beginTriviaMatch(qObj.q, qObj.a);
              }
            }`;
html = html.replace(oldStartBlock, newStartBlock);

// 4. Inject the AI Brain check
if (!html.includes('function isAnswerCorrect')) {
  const aiBrain = `
  function isAnswerCorrect(userText, correctAnswer) {
    if (!userText || !correctAnswer || correctAnswer === 'UNKNOWN') return false;
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUser === cleanCorrect) return true;
    if (cleanUser.length > 2 && cleanCorrect.includes(cleanUser)) return true;
    if (cleanCorrect.length > 2 && cleanUser.includes(cleanCorrect)) return true;
    return false;
  }
  `;
  html = html.replace('function submitTriviaAnswer', aiBrain + '\n  function submitTriviaAnswer');
}

// 5. Use the AI check
html = html.replace(/answer\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, ""\) === currentTriviaAnswer\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\/g, ""\)/, "isAnswerCorrect(answer, currentTriviaAnswer)");

fs.writeFileSync('index.html', html);
console.log("✅ Independent Trivia System installed! No more null answers.");
