const fs = require('fs');

// 1. Fix the Client Check
let html = fs.readFileSync('index.html', 'utf8');
// Update the check to look at `data.from` (the sender) instead of `data.to`
html = html.replace(/if \(data.to !== myBappId\) return; \/\/ Only process if we are the target/g, "if (data.from !== activeChatId) return; // Only process if it's from the current chat");

// 2. Make sure the client sends the `from` ID
html = html.replace(/type: 'trivia_game', action: 'start', to: activeChatId,/g, "type: 'trivia_game', action: 'start', to: activeChatId, from: myBappId,");
html = html.replace(/type: 'trivia_game', action: 'win', to: activeChatId, winner: 'Opponent'/g, "type: 'trivia_game', action: 'win', to: activeChatId, from: myBappId, winner: 'Opponent'");
fs.writeFileSync('index.html', html);

// 3. Fix the Server to keep the `from` field intact (it already does, but let's be sure)
let serverJs = fs.readFileSync('server.js', 'utf8');
// No changes needed on server, it forwards the whole `data` object.
console.log("✅ Client trivia check fixed!");
