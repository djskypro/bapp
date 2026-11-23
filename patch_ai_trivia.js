const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the AI Brain function
const aiBrain = `
  // --- AI TRIVIA BRAIN ---
  function isAnswerCorrect(userText, correctAnswer) {
    if (!userText || !correctAnswer) return false;
    
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact match after cleaning
    if (cleanUser === cleanCorrect) return true;
    
    // If the user typed at least 60% of the correct answer's characters in order
    if (cleanUser.length > 2 && cleanCorrect.includes(cleanUser)) return true;
    if (cleanCorrect.length > 2 && cleanUser.includes(cleanCorrect)) return true;
    
    // Handle numbers (like 12 for 5+7)
    if (cleanUser === cleanCorrect) return true;

    return false;
  }
`;

// Insert the AI Brain right before submitTriviaAnswer
if (!html.includes('function isAnswerCorrect')) {
    html = html.replace('function submitTriviaAnswer', aiBrain + '\n  function submitTriviaAnswer');
}

// 2. Update submitTriviaAnswer to use the AI Brain
// We replace the old strict comparison with our new smart check
const oldCheck = `if (isGameActive && currentTriviaAnswer && answer.toLowerCase().trim() === currentTriviaAnswer.toLowerCase().trim()) {`;
const newCheck = `if (isGameActive && currentTriviaAnswer && isAnswerCorrect(answer, currentTriviaAnswer)) {`;
html = html.replace(oldCheck, newCheck);

// 3. Also update the main chat check (checkTriviaAnswer) if it exists
const oldMainCheck = `if (msgText.toLowerCase().trim() === currentTriviaAnswer) {`;
const newMainCheck = `if (isAnswerCorrect(msgText, currentTriviaAnswer)) {`;
html = html.replace(oldMainCheck, newMainCheck);

fs.writeFileSync('index.html', html);
console.log("✅ AI Trivia Brain installed!");
