const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the AI checking function
const aiBrain = `
  function isAnswerCorrect(userText, correctAnswer) {
    if (!userText || !correctAnswer) return false;
    
    // Clean both strings (lowercase, remove punctuation/spaces)
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanUser === cleanCorrect) return true;
    
    // If the user's answer is contained in the correct answer, or vice versa
    // E.g., "leonardo" is inside "leonardodavinci"
    if (cleanUser.length > 2 && cleanCorrect.includes(cleanUser)) return true;
    if (cleanCorrect.length > 2 && cleanUser.includes(cleanCorrect)) return true;
    
    return false;
  }
`;

// Insert right before submitTriviaAnswer
html = html.replace('function submitTriviaAnswer', aiBrain + '\n  function submitTriviaAnswer');

// 2. Replace the strict check at line 7394 with the AI check
const oldCheck = `if (isGameActive && currentTriviaAnswer && answer.toLowerCase().replace(/[^a-z0-9]/g, "") === currentTriviaAnswer.toLowerCase().replace(/[^a-z0-9]/g, "")) {`;
const newCheck = `if (isGameActive && currentTriviaAnswer && isAnswerCorrect(answer, currentTriviaAnswer)) {`;

html = html.replace(oldCheck, newCheck);
fs.writeFileSync('index.html', html);
console.log("✅ AI Brain injected and wired to the submit check!");
