const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the Start function to ensure it uses the exact same routing as the invite
const oldSend = /function sendTriviaQuestion\(\) \{[\s\S]*?if \(typeof socket !== 'undefined' && socket\.readyState === WebSocket\.OPEN\) \{[\s\S]*?if \(typeof saveMessage === 'function'\) saveMessage\(activeChatId, payload\);\s*\}\s*\}/;

const newSend = `function sendTriviaQuestion() {
    const qObj = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
    
    document.getElementById('trivia-status').innerText = 'Waiting for opponent to answer...';
    document.getElementById('trivia-question').innerText = qObj.q;
    document.getElementById('trivia-question').style.display = 'block';
    document.getElementById('trivia-start-btn').style.display = 'none';
    document.getElementById('trivia-input-area').style.display = 'flex';
    document.getElementById('trivia-answer-input').value = '';
    
    currentTriviaAnswer = qObj.a.toLowerCase().trim();
    isGameActive = true;

    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      // 1. Send the game payload (This opens the popup on the other phone)
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        to: activeChatId, 
        from: myBappId,
        question: qObj.q,
        answer: currentTriviaAnswer
      }));

      // 2. Send the question as a normal message bubble
      const gameMsg = "🏆 TRIVIA: " + qObj.q;
      const payload = {
        type: 'send_message',
        to: activeChatId,
        from: myBappId,
        text: gameMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      
      if (typeof appendMessage === 'function') {
        appendMessage(gameMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
  }`;

html = html.replace(oldSend, newSend);

// 2. Make the receiving logic bulletproof
const oldReceive = /else if \(data.action === 'win'\) \{[\s\S]*?isGameActive = false;\s*\}/;
const newReceive = `else if (data.action === 'win') {
              triviaScores.them++;
              document.getElementById('score-them').innerText = triviaScores.them;
              document.getElementById('trivia-status').innerText = '🏆 Opponent won the round!';
              document.getElementById('trivia-start-btn').style.display = 'block';
              document.getElementById('trivia-question').style.display = 'none';
              document.getElementById('trivia-input-area').style.display = 'none';
              currentTriviaAnswer = null;
              isGameActive = false;
            }`;
html = html.replace(oldReceive, newReceive);

// Make sure the listener correctly checks the sender
html = html.replace("if (data.from !== activeChatId) return;", "if (data.from !== activeChatId) return; // Check if the message is from the person we are chatting with");

fs.writeFileSync('index.html', html);
console.log("✅ Trivia start synced!");
