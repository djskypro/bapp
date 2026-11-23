const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Replace the trivia route to ensure answer/question are passed
const oldRoute = `if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return;
        }`;

const newRoute = `if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                // Explicitly rebuild the payload to ensure nothing is lost
                const payload = {
                    type: 'trivia_game',
                    action: data.action,
                    from: data.from,
                    to: data.to,
                    question: data.question || null,
                    answer: data.answer || null
                };
                bappUsers.get(data.to).send(JSON.stringify(payload));
            }
            return;
        }`;

if (serverJs.includes(oldRoute)) {
    serverJs = serverJs.replace(oldRoute, newRoute);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server routing fixed!");
} else {
    console.log("❌ Could not find route in server.js");
}
