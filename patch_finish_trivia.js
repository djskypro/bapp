const fs = require('fs');

// 1. Fix the Server to send the answer correctly
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/if \(data\.type === 'trivia_game'\) \{[\s\S]*?return;\s*\}/, `
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return;
        }
`);
fs.writeFileSync('server.js', serverJs);

// 2. Fix the Client logic
let html = fs.readFileSync('index.html', 'utf8');

// A. Make sure the answer is saved correctly when the game starts
const oldBegin = `document.getElementById('trivia-status').innerText = 'Type your answer below! (Ans: ' + currentTriviaAnswer + ')';
    console.log('Answer saved as: ', currentTriviaAnswer);`;
const newBegin = `document.getElementById('trivia-status').innerText = 'Type your answer below!';
    const inputBox = document.getElementById('trivia-answer-input');
    if(inputBox) { inputBox.disabled = false; inputBox.style.opacity = '1'; inputBox.value = ''; }`;
html = html.replace(oldBegin, newBegin);

// B. Fix the submit logic to match correctly and unlock input
const oldSubmit = `if (isGameActive && currentTriviaAnswer && answer.toLowerCase().replace(/[^a-z0-9]/g, "") === currentTriviaAnswer.toLowerCase().replace(/[^a-z0-9]/g, "")) {`;
const newSubmit = `if (isGameActive && currentTriviaAnswer && answer.toLowerCase().trim() === currentTriviaAnswer.toLowerCase().trim()) {`;
html = html.replace(oldSubmit, newSubmit);

// C. Ensure the Game UI resets properly
html = html.replace("document.getElementById('trivia-ready-btn').style.display = 'none';\n    document.getElementById('trivia-input-area').style.display = 'none';", "document.getElementById('trivia-ready-btn').style.display = 'none';\n    document.getElementById('trivia-input-area').style.display = 'flex';");

fs.writeFileSync('index.html', html);
console.log("✅ Trivia fixed! Answer sync and input box unlocked.");
