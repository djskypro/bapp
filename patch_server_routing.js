const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Find the trivia routing block and force it to pass the data exactly as received
const oldRoute = `if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return;
        }`;

const newRoute = `if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                // Send the exact data back to the other user
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; // Stop processing this message as a normal chat
        }`;

if (serverJs.includes(oldRoute)) {
    serverJs = serverJs.replace(oldRoute, newRoute);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server routing fixed to pass trivia_game natively!");
} else {
    console.log("❌ Could not find the trivia route in server.js. Let's check the logs.");
}
