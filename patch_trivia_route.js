const fs = require('fs');

// --- 1. FIX SERVER.JS ---
let serverJs = fs.readFileSync('server.js', 'utf8');
// Remove the broken injection we added earlier
serverJs = serverJs.replace(/\/\/ --- TRIVIA ROUTING ---[\s\S]*?\/\/ ----------------------/, '');

// Add the correct routing using bappUsers
const correctRouting = `
        // --- TRIVIA ROUTING ---
        if (data.type === 'trivia_game') {
            if (bappUsers.has(data.to)) {
                bappUsers.get(data.to).send(JSON.stringify(data));
            }
            return;
        }
        // ----------------------
`;
serverJs = serverJs.replace("const data = JSON.parse(message);", "const data = JSON.parse(message);\n" + correctRouting);
fs.writeFileSync('server.js', serverJs);

// --- 2. FIX INDEX.HTML ---
let html = fs.readFileSync('index.html', 'utf8');
// Replace chatId with to for both sending and receiving
html = html.replace(/type: 'trivia_game', action: 'start', chatId: activeChatId,/g, "type: 'trivia_game', action: 'start', to: activeChatId,");
html = html.replace(/type: 'trivia_game', action: 'win', chatId: activeChatId,/g, "type: 'trivia_game', action: 'win', to: activeChatId,");
html = html.replace(/if \(data.chatId !== activeChatId\) return;/g, "if (data.to !== myBappId) return; // Only process if we are the target");

fs.writeFileSync('index.html', html);
console.log("✅ Server and Client trivia routing fixed!");
