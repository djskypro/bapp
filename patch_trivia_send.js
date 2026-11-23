const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the sendMessage function and inject the trivia check
const oldCode = `if (text === "") return;`;
const newCode = `if (text === "") return;

    // --- TRIVIA CHECK ---
    if (typeof window.checkTriviaAnswer === 'function' && window.checkTriviaAnswer(text)) {
      input.value = ''; // Clear input if they won
      return; // Stop the message from sending to the chat normally
    }
    // --------------------`;

html = html.replace(oldCode, newCode);
fs.writeFileSync('index.html', html);
console.log("✅ Trivia Answer Check injected into sendMessage!");
