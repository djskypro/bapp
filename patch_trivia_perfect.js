const fs = require('fs');

// 1. Fix the Server routing to ensure Trivia goes to the right user
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/\/\/ --- TRIVIA ROUTING ---[\s\S]*?\/\/ ----------------------/, '');
const triviaRoute = `
        // --- TRIVIA ROUTING ---
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return;
        }
        // ----------------------
`;
serverJs = serverJs.replace("const data = JSON.parse(message);", "const data = JSON.parse(message);\n" + triviaRoute);
fs.writeFileSync('server.js', serverJs);

// 2. Fix the Client sendTriviaQuestion function
let html = fs.readFileSync('index.html', 'utf8');

const oldSend = /function sendTriviaQuestion\(\) \{[\s\S]*?if \(typeof socket !== 'undefined' && socket\.readyState === WebSocket\.OPEN\) \{[\s\S]*?appendMessage\(gameMsg, 'sent', payload\.timeStr, 'sent', false, false, payload\.msgId\);\s*if \(typeof saveMessage === 'function'\) saveMessage\(activeChatId, payload\);\s*\}\s*\}/;

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
      // 1. Send the game payload (opens popup)
      socket.send(JSON.stringify({ 
        type: 'trivia_game', 
        action: 'start', 
        to: activeChatId, 
        from: myBappId,
        question: qObj.q,
        answer: currentTriviaAnswer
      }));

      // 2. Send the normal message bubble using the server's expected 'send_message' type
      const gameMsg = "🏆 TRIVIA: " + qObj.q;
      const payload = {
        type: 'send_message', // This is the magic key your server uses!
        to: activeChatId,
        from: myBappId,
        text: gameMsg,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      
      // Add it to your own screen immediately
      if (typeof appendMessage === 'function') {
        appendMessage(gameMsg, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
        if (typeof saveMessage === 'function') saveMessage(activeChatId, payload);
      }
    }
  }`;

html = html.replace(oldSend, newSend);

// 3. Make sure the incoming 'trivia_game' handles the 'win' state properly
html = html.replace(/else if \(data.action === 'win'\) \{[\s\S]*?isGameActive = false;\s*\}/, `else if (data.action === 'win') {
              triviaScores.them++;
              document.getElementById('score-them').innerText = triviaScores.them;
              document.getElementById('trivia-status').innerText = '🏆 Opponent won the round!';
              document.getElementById('trivia-start-btn').style.display = 'block';
              document.getElementById('trivia-question').style.display = 'none';
              document.getElementById('trivia-input-area').style.display = 'none';
              currentTriviaAnswer = null;
              isGameActive = false;
            }`);

fs.writeFileSync('index.html', html);
console.log("✅ Trivia perfectly synced with send_message!");
