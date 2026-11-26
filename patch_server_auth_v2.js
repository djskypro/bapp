const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const startMarker = "if (data.type === 'register_user') {";
const endMarker = "if (data.type === 'search_user') {";

const startIndex = serverJs.indexOf(startMarker);
const endIndex = serverJs.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newAuthBlock = `if (data.type === 'auth_request') {
            const uname = String(data.username || '').trim().toLowerCase();
            const pass = String(data.password || '');
            
            if (!uname || !pass) return;

            if (supabase) {
                supabase.from('user').select('username, password, profile').eq('username', uname).then(({ data: rows, error }) => {
                    if (error) {
                        console.error("❌ Supabase auth error:", error.message);
                        ws.send(JSON.stringify({ type: 'auth_error', message: 'Server error.' }));
                        return;
                    }
                    
                    const user = rows && rows[0];
                    
                    if (data.isLogin) {
                        if (!user) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'User not found.' }));
                        } else if (user.password !== pass) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'Incorrect password.' }));
                        } else {
                            bappUsers.set(uname, ws);
                            ws.send(JSON.stringify({ type: 'auth_success', username: uname, profile: user.profile || { name: uname } }));
                        }
                    } else {
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
            return;
        }

        `;
    serverJs = serverJs.slice(0, startIndex) + newAuthBlock + serverJs.slice(endIndex);
    fs.writeFileSync('server.js', serverJs);
    console.log("✅ Server secure auth logic replaced!");
} else {
    console.log("❌ Could not find the markers.");
}
