const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Safe fallback for beginTriviaMatch
const oldBegin = `currentTriviaAnswer = answer.toLowerCase().trim();`;
const newBegin = `currentTriviaAnswer = answer ? answer.toLowerCase().trim() : "UNKNOWN";`;
html = html.replace(oldBegin, newBegin);

// 2. Ensure the AI check is used in submitTriviaAnswer
const oldCheck = `answer.toLowerCase().replace(/[^a-z0-9]/g, "") === currentTriviaAnswer.toLowerCase().replace(/[^a-z0-9]/g, "")`;
const newCheck = `isAnswerCorrect(answer, currentTriviaAnswer)`;
html = html.replace(oldCheck, newCheck);

fs.writeFileSync('index.html', html);
console.log("✅ Client AI check applied and safe fallback added.");
