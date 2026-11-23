const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Force the server to catch trivia_game BEFORE anything else
const insertPoint = "const data = JSON.parse(message);";
const triviaRoute = `
        // --- FORCE TRIVIA ROUTING ---
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; // STOP processing. Do not let it become a chat message.
        }
`;
// Only insert if it's not already there
if (!serverJs.includes('// --- FORCE TRIVIA ROUTING ---')) {
    serverJs = serverJs.replace(insertPoint, insertPoint + "\n" + triviaRoute);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server forced to route Trivia!");
}
