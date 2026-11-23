const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add RPS routing right next to the Trivia routing
const insertPoint = "if (data.type === 'trivia_game') {";
const rpsRoute = `if (data.type === 'rps_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return; 
        }
        
        `;

if (!serverJs.includes("data.type === 'rps_game'")) {
    serverJs = serverJs.replace(insertPoint, rpsRoute + insertPoint);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server routing for RPS added!");
}
