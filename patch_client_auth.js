const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update socket.onopen to send the password
const oldOnOpen = `socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));`;
const newOnOpen = `const savedPass = localStorage.getItem('bapp_password');
            if (savedPass) {
                socket.send(JSON.stringify({ type: 'auth_request', username: myBappId, password: savedPass, isLogin: true }));
            } else {
                localStorage.removeItem('bapp_username');
                window.location.reload();
            }`;
if (html.includes(oldOnOpen)) {
    html = html.replace(oldOnOpen, newOnOpen);
} else {
    // Try the other instance
    html = html.replace(/socket\.send\(JSON\.stringify\(\{ type: 'register_user', username: myBappId, profile: myProfile \}\)\);/g, newOnOpen);
}

// 2. Add auth_success and auth_error to the main message listener
const oldHandler = `if (data.type === 'new_message') {`;
const newHandler = `if (data.type === 'auth_success') {
            localStorage.setItem('bapp_username', data.username);
            if (data.profile) localStorage.setItem('bapp_profile', JSON.stringify(data.profile));
            window.location.reload();
            return;
        } else if (data.type === 'auth_error') {
            alert(data.message);
            localStorage.removeItem('bapp_username');
            localStorage.removeItem('bapp_password');
            window.location.reload();
            return;
        }

        if (data.type === 'new_message') {`;

html = html.replace(oldHandler, newHandler);

fs.writeFileSync('index.html', html);
console.log("✅ Client auth logic updated!");
