const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the UI to use the Ready button and hide the old Start button
const oldUIRegex = /<div id="trivia-game"[\s\S]*?<\/div>\s*<\/div>/;
const newUI = `
<div id="trivia-game" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:85%; max-width:350px; background:rgba(20,20,20,0.95); backdrop-filter:blur(25px); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:25px; z-index:999999; flex-direction:column; gap:15px; box-shadow:0 20px 50px rgba(0,0,0,0.8); text-align:center;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span style="color:var(--primary); font-weight:bold; font-size:16px;">🏆 Trivia Quiz</span>
    <span onclick="closeTrivia()" style="cursor:pointer; font-size:20px;">✕</span>
  </div>

  <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.5); padding:10px; border-radius:10px; margin-bottom:10px;">
    <div style="text-align:center; flex:1;">
      <div style="font-size:12px; color:#aaa;">You</div>
      <div id="score-you" style="font-size:20px; font-weight:bold; color:var(--primary);">0</div>
    </div>
    <div style="width:1px; background:rgba(255,255,255,0.2);"></div>
    <div style="text-align:center; flex:1;">
      <div style="font-size:12px; color:#aaa;">Opponent</div>
      <div id="score-them" style="font-size:20px; font-weight:bold; color:white;">0</div>
    </div>
  </div>
  
  <div id="trivia-status" style="font-size:14px; color:#aaa;">Waiting to start...</div>
  <div id="trivia-question" style="font-size:18px; font-weight:bold; color:white; margin:10px 0; display:none;"></div>
  
  <div id="trivia-input-area" style="display:none; gap:10px; margin-top:10px;">
    <input type="text" id="trivia-answer-input" placeholder="Type answer here..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:12px; color:white; outline:none;" onkeypress="if(event.key==='Enter') submitTriviaAnswer()">
    <button onclick="submitTriviaAnswer()" style="background:var(--primary); border:none; padding:0 15px; border-radius:12px; font-weight:bold; cursor:pointer;">Send</button>
  </div>

  <!-- ONLY THE READY BUTTON IS VISIBLE -->
  <button id="trivia-ready-btn" onclick="acceptTriviaMatch()" style="background:var(--primary); color:black; border:none; padding:12px; border-radius:15px; font-weight:bold; font-size:16px; cursor:pointer; display:none;">✅ I'm Ready</button>
</div>
`;
html = html.replace(oldUIRegex, newUI);

// 2. Ensure the logic correctly switches from "Ready" to "Start"
// Replace the logic inside startTrivia to show the Ready button
html = html.replace(
  "document.getElementById('trivia-ready-btn').style.display = 'block';", 
  "document.getElementById('trivia-ready-btn').style.display = 'block';\n    document.getElementById('trivia-ready-btn').innerText = \"✅ I'm Ready\";"
);

fs.writeFileSync('index.html', html);
console.log("✅ Trivia UI fixed: Start button replaced with Ready button!");
