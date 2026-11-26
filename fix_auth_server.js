const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const authLogic = `
        if (data.type === 'register_user') {
            const uname = String(data.username || '').trim().toLowerCase();
            const pass = String(data.password || '').trim();
            const prof = data.profile || { name: uname };
            
            if (uname && pass) {
                bappUsers.set(uname, ws);
                if (supabase) {
                    supabase.from('user').select('username').eq('username', uname).then(({ data: existing }) => {
                        if (existing && existing.length > 0) {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'Username already exists!' }));
                            bappUsers.delete(uname);
                        } else {
                            supabase.from('user').insert({ username: uname, password: pass, profile: prof }).then(({ error }) => {
                                if (error) {
                                    console.error("❌ Supabase register:", error.message);
                                    ws.send(JSON.stringify({ type: 'auth_error', message: 'Database error' }));
                                } else {
                                    ws.send(JSON.stringify({ type: 'auth_success', username: uname, profile: prof }));
                                }
                            });
                        }
                    });
                }
            }
        }

        if (data.type === 'login_user') {
            const uname = String(data.username || '').trim().toLowerCase();
            const pass = String(data.password || '').trim();
            if (uname && pass && supabase) {
                supabase.from('user').select('*').eq('username', uname).eq('password', pass).then(({ data: users, error }) => {
                    if (error || !users || users.length === 0) {
                        ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid username or password' }));
                    } else {
                        bappUsers.set(uname, ws);
                        ws.send(JSON.stringify({ type: 'auth_success', username: uname, profile: users[0].profile }));
                    }
                });
            }
        }

        if (data.type === 'search_user') {`;

// Replace the search_user block with our new auth logic + search
serverJs = serverJs.replace("if (data.type === 'search_user') {", authLogic);
fs.writeFileSync('server.js', serverJs);
console.log('✅ Server Auth logic injected!');
