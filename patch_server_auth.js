const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldAuth = /if \(data\.type === 'register_user'\) \{[\s\S]*?supabase\.from\('user'\)\.upsert.*?\}\);\s*\}\s*\}\s*\}/;
const newAuth = `if (data.type === 'auth_request') {
            const uname = String(data.username || '').trim().toLowerCase();
            const pass = String(data.password || '');
            
            if (!uname || !pass) return;

            if (supabase) {
                // Check if user exists
                supabase.from('user').select('username, password, profile').eq('username', uname).then(({ data: rows, error }) => {
                    if (error) {
                        console.error("❌ Supabase auth error:", error.message);
                        return;
                    }
                    
                    const user = rows && rows[0];
                    
                    if (data.isLogin) {
                        // LOGIN MODE
                        if (!user) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'User not found. Please sign up.' }));
                        } else if (user.password !== pass) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'Incorrect password.' }));
                        } else {
                            bappUsers.set(uname, ws);
                            ws.send(JSON.stringify({ type: 'auth_success', username: uname, profile: user.profile || { name: uname } }));
                        }
                    } else {
                        // SIGN UP MODE
                        if (user) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'Username already taken.' }));
                        } else {
                            const prof = { name: uname };
                            supabase.from('user').insert([{ username: uname, password: pass, profile: prof }]).then(({ error }) => {
                                if (error) {
                                    ws.send(JSON.stringify({ type: 'auth_error', message: 'Database error.' }));
                                } else {
                                    bappUsers.set(uname, ws);
                                    ws.send(JSON.stringify({ type: 'auth_success', username: uname, profile: prof }));
                                }
                            });
                        }
                    }
                });
            } else {
                ws.send(JSON.stringify({ type: 'auth_error', message: 'Database not connected.' }));
            }
        }`;

if (serverJs.match(oldAuth)) {
    serverJs = serverJs.replace(oldAuth, newAuth);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server auth logic replaced!");
} else {
    console.log("❌ Could not find the exact register_user block in server.js. Let me see the lines.");
}
