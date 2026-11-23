const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix the Sender's UI (Ensure Start button is hidden, Ready button is shown)
// We use regex to find the startTrivia function and overwrite the UI toggles
const startTriviaRegex = /function startTrivia\(\) \{[\s\S]*?if \(typeof closeChatMenu === 'function'\) closeChatMenu\(\);\s*\}/;
const newStartTrivia = `function startTrivia() {
    // Send the invite message
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const inviteMsg = "🏆 I invited you to play Trivia!";
      const payload = {
        type: 'send_message', to: activeChatId, from: myBappId, text: inviteMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      if (typeof appendMessage === 'function') {
        appendMessage(inviteMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }

    // Show the READY UI
    document.getElementById('trivia-game').style.display = 'flex';
    document.getElementById('trivia-question').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'none';
    
    const readyBtn = document.getElementById('trivia-ready-btn');
    if(readyBtn) {
      readyBtn.style.display = 'block';
      readyBtn.innerText = "✅ I'm Ready";
    }
    // Hide old start button if it still exists
    const oldStartBtn = document.getElementById('trivia-start-btn');
    if(oldStartBtn) oldStartBtn.style.display = 'none';

    document.getElementById('trivia-status').innerText = 'Are you ready to start?';
    isPlayer1 = true;
    
    if (typeof closeChatMenu === 'function') closeChatMenu();
  }`;
html = html.replace(startTriviaRegex, newStartTrivia);

// 2. Inject the Receiver's popup logic into the new_message handler
// This intercepts the invite and opens the Ready popup for the other user
const oldMessageHook = "if (data.type === 'new_message') {";
const newMessageHook = `if (data.type === 'new_message') {
        
        // --- TRIVIA INVITE INTERCEPTOR ---
        if (data.text === "🏆 I invited you to play Trivia!") {
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
        }
        // ---------------------------------
`;
html = html.replace(oldMessageHook, newMessageHook);

fs.writeFileSync('index.html', html);
console.log("✅ Trivia Ready UI and Interceptor injected!");
