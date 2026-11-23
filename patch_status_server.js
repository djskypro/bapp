const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// 1. Add statuses database file
if(!serverJs.includes('STATUSES_FILE')) {
    const dbLogic = `
const STATUSES_FILE = path.join(__dirname, 'statuses.json');
if (!fs.existsSync(STATUSES_FILE)) fs.writeFileSync(STATUSES_FILE, JSON.stringify([]));
`;
    serverJs = serverJs.replace("const USERS_FILE =", dbLogic + "\nconst USERS_FILE =");
}

// 2. Add status logic to the WebSocket connection
const statusLogic = `
        if (data.type === 'get_statuses') {
            let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));
            // Clean up statuses older than 24 hours
            const now = Date.now();
            statuses = statuses.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
            fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
            ws.send(JSON.stringify({ type: 'statuses_list', statuses: statuses }));
        }

        if (data.type === 'add_status') {
            let statuses = JSON.parse(fs.readFileSync(STATUSES_FILE));
            const newStatus = {
                id: Date.now().toString(),
                username: data.username,
                text: data.text,
                media: data.media,
                timestamp: Date.now()
            };
            statuses.push(newStatus);
            fs.writeFileSync(STATUSES_FILE, JSON.stringify(statuses));
            
            // Broadcast to everyone (simulating a feed)
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ type: 'new_status', status: newStatus }));
                }
            });
        }
`;

// Inject right before 'register_user'
serverJs = serverJs.replace("if (data.type === 'register_user') {", statusLogic + "\n        if (data.type === 'register_user') {");

fs.writeFileSync('server.js', serverJs);
console.log('✅ Server patched for Status updates!');
