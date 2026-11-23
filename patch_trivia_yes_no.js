const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the UI to have both Yes and No buttons
const oldBtnRegex = /<button id="trivia-ready-btn"[^>]*>.*?<\/button>/;
const newButtons = `
  <div id="trivia-actions" style="display:flex; gap:10px; margin-top:15px; justify-content:center;">
    <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="flex:1; background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer; display:none;">✅ I'm Ready</button>
    <button id="trivia-not-ready-btn" onclick="declineTriviaMatch()" style="flex:1; background:rgba(231, 76, 60, 0.2); color:#e74c3c; border:1px solid #e74c3c; padding:12px; border-radius:15px; font-weight:bold; font-size:14px; cursor:pointer; display:none;">❌ Not Ready</button>
  </div>
`;
html = html.replace(oldBtnRegex, newButtons);

// 2. Update the JS to show/hide BOTH buttons
// A. In startTrivia (for the sender)
html = html.replace(
    /const readyBtn = document\.getElementById\('trivia-ready-btn'\);\s*if\(readyBtn\) \{\s*readyBtn\.style\.display = 'block';\s*readyBtn\.innerText = "✅ I'm Ready";\s*readyBtn\.setAttribute\('onclick', 'acceptTriviaMatch\(\)'\);\s*\}/g,
    `document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';`
);

// B. In the receiver's interceptor
html = html.replace(
    /\/\/ FORCE THE BUTTON TO SHOW\s*const readyBtn = document\.getElementById\('trivia-ready-btn'\);\s*if\(readyBtn\) \{\s*readyBtn\.style\.display = 'block';\s*readyBtn\.innerText = "✅ I'm Ready";\s*readyBtn\.setAttribute\('onclick', 'acceptTriviaMatch\(\)'\);\s*\}/g,
    `document.getElementById('trivia-ready-btn').style.display = 'block';
    document.getElementById('trivia-not-ready-btn').style.display = 'block';`
);

// 3. Add the decline function
const declineFunction = `
  function declineTriviaMatch() {
    document.getElementById('trivia-ready-btn').style.display = 'none';
    document.getElementById('trivia-not-ready-btn').style.display = 'none';
    document.getElementById('trivia-status').innerText = 'You declined the game.';
    
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trivia_game', action: 'decline', to: activeChatId, from: myBappId }));
    }
  }
`;
html = html.replace('function closeTrivia() {', declineFunction + '\n  function closeTrivia() {');

// 4. Handle the decline in the WebSocket listener
const declineListener = `
            if (data.action === 'decline') {
              document.getElementById('trivia-ready-btn').style.display = 'none';
              document.getElementById('trivia-not-ready-btn').style.display = 'none';
              document.getElementById('trivia-status').innerText = 'Opponent declined the game. 😔';
              setTimeout(closeTrivia, 2000); // Auto close after 2s
              return;
            }
`;
html = html.replace("if (data.action === 'ready') {", declineListener + "\n            if (data.action === 'ready') {");

// 5. Make sure ready buttons hide when the match starts
html = html.replace(
    "document.getElementById('trivia-input-area').style.display = 'flex';\n    document.getElementById('trivia-answer-input').value = '';\n    document.getElementById('trivia-ready-btn').style.display = 'none';",
    "document.getElementById('trivia-input-area').style.display = 'flex';\n    document.getElementById('trivia-answer-input').value = '';\n    document.getElementById('trivia-ready-btn').style.display = 'none';\n    document.getElementById('trivia-not-ready-btn').style.display = 'none';"
);

fs.writeFileSync('index.html', html);
console.log("✅ Yes/No buttons added and decline logic wired up!");
