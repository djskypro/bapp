const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a variable to track chances
if (!html.includes('let triviaChances = 2;')) {
    html = html.replace('let isGameActive = false;', 'let isGameActive = false;\n  let triviaChances = 2;');
}

// 2. Reset chances when a new match begins
html = html.replace(
    "function beginTriviaMatch(question, answer) {",
    "function beginTriviaMatch(question, answer) {\n    triviaChances = 2;"
);

// 3. Update submitTriviaAnswer to handle chances and lock the box
const oldSubmit = `function submitTriviaAnswer(forcedText = null) {
    const input = document.getElementById('trivia-answer-input');
    const answer = forcedText || (input ? input.value.trim() : '');
    if (!answer) return;

    if (isGameActive && currentTriviaAnswer && answer.toLowerCase() === currentTriviaAnswer) {`;

const newSubmit = `function submitTriviaAnswer(forcedText = null) {
    const input = document.getElementById('trivia-answer-input');
    const answer = forcedText || (input ? input.value.trim() : '');
    if (!answer) return;

    if (isGameActive && currentTriviaAnswer && answer.toLowerCase().trim() === currentTriviaAnswer) {`;

html = html.replace(oldSubmit, newSubmit);

// 4. Replace the failure logic to subtract chances
const oldFail = `} else {
      input.value = '';
      const status = document.getElementById('trivia-status');
      const oldStatus = status.innerText;
      status.innerText = '❌ Wrong answer, try again!';
      setTimeout(() => { if(status.innerText === '❌ Wrong answer, try again!') status.innerText = oldStatus; }, 1500);
    }`;

const newFail = `} else {
      input.value = '';
      triviaChances--;
      const status = document.getElementById('trivia-status');
      
      if (triviaChances > 0) {
        status.innerText = '❌ Wrong! You have ' + triviaChances + ' chance(s) left.';
        setTimeout(() => { if(status.innerText.includes('Wrong!')) status.innerText = 'Type your answer below!'; }, 2000);
      } else {
        // Out of chances
        isGameActive = false;
        status.innerText = '❌ Out of chances! The answer was: ' + currentTriviaAnswer;
        input.disabled = true;
        input.style.opacity = '0.5';
        document.getElementById('trivia-question').style.display = 'none';
      }
    }`;

html = html.replace(oldFail, newFail);

// 5. Re-enable the input box when a new match starts
html = html.replace(
    "document.getElementById('trivia-input-area').style.display = 'flex';",
    "document.getElementById('trivia-input-area').style.display = 'flex';\n    const inputBox = document.getElementById('trivia-answer-input');\n    if(inputBox) { inputBox.disabled = false; inputBox.style.opacity = '1'; }"
);

fs.writeFileSync('index.html', html);
console.log("✅ 2-Chance logic added and server sync fixed!");
