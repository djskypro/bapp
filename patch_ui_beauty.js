const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the main container to be a centered glass box with full background blur
const oldContainerStyle = 'id="trivia-game" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter:blur(15px); z-index:999999; justify-content:center; align-items:center; flex-direction:column;"';
const newContainerStyle = 'id="trivia-game" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); z-index:999999; justify-content:center; align-items:center; flex-direction:column;"';
html = html.replace(oldContainerStyle, newContainerStyle);

// Wrap the inner content in a glass box if it isn't already
const oldInnerStart = `<div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>`;
const newInnerStart = `<div class="glass" style="width:90%; max-width:350px; background:rgba(20,20,20,0.95); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center; display:flex; flex-direction:column; gap:15px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>`;
html = html.replace(oldInnerStart, newInnerStart);

// Close the inner div correctly (we need to find where the trivia-game div ends and add a closing div for our new glass box)
const endOfTrivia = `  </div>
  </div>`;
// Find the end of the end game button and close the glass box
const endGameBtnRegex = /<button onclick="endTriviaGame\(\)"[^>]*>End Game<\/button>/;
html = html.replace(endGameBtnRegex, `<button onclick="endTriviaGame()" style="background:rgba(231,76,60,0.2); color:#e74c3c; border:1px solid #e74c3c; border-radius:12px; padding:8px 15px; font-weight:bold; font-size:12px; cursor:pointer; margin-top:10px;">End Game</button>\n  </div>`);

// 2. Fix the input area styling
html = html.replace(
    'id="trivia-input-area" style="display:none; gap:10px; margin-top:10px; justify-content:center;"',
    'id="trivia-input-area" style="display:none; gap:10px; margin-top:5px; justify-content:center;"'
);

fs.writeFileSync('index.html', html);
console.log("✅ UI beautified and server crash protected.");
