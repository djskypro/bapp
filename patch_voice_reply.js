const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The exact block from your debug_voice.txt output
const oldVoiceCode = `          reader.onloadend = () => {
            const base64Audio = reader.result;
            const to = activeChatId;
            const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Send to server
            socket.send(JSON.stringify({ type: 'send_message', to: to, from: myBappId, text: base64Audio, isVoice: true }));

            // Append UI
            appendMessage(base64Audio, 'sent', now, 'sent', false, true);

            // Save to local storage
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent' });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));`;

const newVoiceCode = `          reader.onloadend = () => {
            const base64Audio = reader.result;
            const to = activeChatId;
            const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const msgId = Date.now().toString();
            const reply = currentReplyTo; // Capture the reply state

            // Send to server with reply data
            socket.send(JSON.stringify({ 
                type: 'send_message', 
                to: to, 
                from: myBappId, 
                text: base64Audio, 
                isVoice: true, 
                msgId: msgId, 
                replyData: reply 
            }));

            // Append UI with reply data
            appendMessage(base64Audio, 'sent', now, 'sent', false, true, msgId, reply);

            // Save to local storage with reply data
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: base64Audio, type: 'sent', time: now, isVoice: true, status: 'sent', msgId: msgId, replyData: reply });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            
            // Clear the reply state after sending
            if (typeof cancelReply === 'function') cancelReply();`;

if (html.includes(oldVoiceCode)) {
    html = html.replace(oldVoiceCode, newVoiceCode);
    fs.writeFileSync('index.html', html);
    console.log('✅ Voice note reply logic fixed perfectly!');
} else {
    console.log('❌ Could not find the exact voice block. The spacing might be slightly different.');
}
