const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldFunction = `function checkRPSWinner() {
    if (!myRPSChoice || !opponentRPSChoice) return;
    
    const status = document.getElementById('rps-status');
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    status.innerText = 'You: ' + emojis[myRPSChoice] + ' vs Opponent: ' + emojis[opponentRPSChoice] + '\\n';
    
    if (myRPSChoice === opponentRPSChoice) {
      status.innerText += 'It\\'s a tie! 🤝';
    } else if (
      (myRPSChoice === 'rock' && opponentRPSChoice === 'scissors') ||
      (myRPSChoice === 'paper' && opponentRPSChoice === 'rock') ||
      (myRPSChoice === 'scissors' && opponentRPSChoice === 'paper')
    ) {
      status.innerText += '🏆 You Win!';
    } else {
      status.innerText += '😔 You Lose!';
    }
    
    myRPSChoice = null;
    opponentRPSChoice = null;
  }`;

const newFunction = `function checkRPSWinner() {
    if (!myRPSChoice || !opponentRPSChoice) return;
    
    const status = document.getElementById('rps-status');
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    status.innerText = 'You: ' + emojis[myRPSChoice] + ' vs Opponent: ' + emojis[opponentRPSChoice] + '\\n';
    
    if (myRPSChoice === opponentRPSChoice) {
      status.innerText += 'It\\'s a tie! 🤝';
    } else if (
      (myRPSChoice === 'rock' && opponentRPSChoice === 'scissors') ||
      (myRPSChoice === 'paper' && opponentRPSChoice === 'rock') ||
      (myRPSChoice === 'scissors' && opponentRPSChoice === 'paper')
    ) {
      status.innerText += '🏆 You Win!';
      rpsScores.you++;
      document.getElementById('rps-score-you').innerText = rpsScores.you;
    } else {
      status.innerText += '😔 You Lose!';
      rpsScores.them++;
      document.getElementById('rps-score-them').innerText = rpsScores.them;
    }
    
    myRPSChoice = null;
    opponentRPSChoice = null;
  }`;

if (html.includes(oldFunction)) {
    html = html.replace(oldFunction, newFunction);
    fs.writeFileSync('index.html', html);
    console.log("✅ RPS scores now update perfectly!");
} else {
    console.log("❌ Could not find the exact checkRPSWinner function block.");
}
