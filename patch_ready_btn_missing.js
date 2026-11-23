const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force the receiver's interceptor to display the Ready button
// We find the interceptor block we added earlier
const oldInterceptor = `if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                
                const readyBtn = document.getElementById('trivia-ready-btn');
                if(readyBtn) {
                  readyBtn.style.display = 'block';
                  readyBtn.innerText = "✅ I'm Ready";
                }
                const oldStartBtn = document.getElementById('trivia-start-btn');
                if(oldStartBtn) oldStartBtn.style.display = 'none';

                isPlayer1 = false;
            }
        }`;

const newInterceptor = `if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                
                // FORCE THE BUTTON TO SHOW
                const readyBtn = document.getElementById('trivia-ready-btn');
                if(readyBtn) {
                  readyBtn.style.display = 'block';
                  readyBtn.innerText = "✅ I'm Ready";
                  readyBtn.setAttribute('onclick', 'acceptTriviaMatch()');
                }
                const oldStartBtn = document.getElementById('trivia-start-btn');
                if(oldStartBtn) oldStartBtn.style.display = 'none';

                isPlayer1 = false;
            }
        }`;

html = html.replace(oldInterceptor, newInterceptor);

// 2. Ensure the startTrivia function also forces the button to show
const oldStartShow = `const readyBtn = document.getElementById('trivia-ready-btn');
    if(readyBtn) readyBtn.style.display = 'block';`;
    
const newStartShow = `const readyBtn = document.getElementById('trivia-ready-btn');
    if(readyBtn) {
        readyBtn.style.display = 'block';
        readyBtn.innerText = "✅ I'm Ready";
        readyBtn.setAttribute('onclick', 'acceptTriviaMatch()');
    }`;

html = html.replace(oldStartShow, newStartShow);

fs.writeFileSync('index.html', html);
console.log("✅ Ready button forced to display on both sides!");
