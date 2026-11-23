const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add a sanitize function inside the Trivia script
if (!html.includes('function sanitizeText')) {
    const sanitizeJS = `
  function sanitizeText(str) {
    if (!str) return "";
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
  }
  `;
    html = html.replace('let isGameActive = false;', sanitizeJS + '\n  let isGameActive = false;');
}

// 2. Update submitTriviaAnswer to use the sanitizer
const oldSubmit = `if (isGameActive && currentTriviaAnswer && answer.toLowerCase().trim() === currentTriviaAnswer) {`;
const newSubmit = `if (isGameActive && currentTriviaAnswer && sanitizeText(answer) === sanitizeText(currentTriviaAnswer)) {`;
html = html.replace(oldSubmit, newSubmit);

fs.writeFileSync('index.html', html);
console.log("✅ Brain added: Text is now sanitized before comparing!");
