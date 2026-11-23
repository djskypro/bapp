const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add a debug log right before the comparison
html = html.replace(
  "if (isGameActive && currentTriviaAnswer && answer.toLowerCase() === currentTriviaAnswer) {",
  "console.log('DEBUG TRIVIA: You typed:', answer.toLowerCase(), '| Correct is:', currentTriviaAnswer);\n    if (isGameActive && currentTriviaAnswer && answer.toLowerCase() === currentTriviaAnswer) {"
);

fs.writeFileSync('index.html', html);
console.log("✅ Debug log added!");
