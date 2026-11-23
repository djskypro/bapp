const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Find the exact start of appendMessage from your output
const oldAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {`;

// 2. Inject the Whisper logic right after the ID is set
const newAppendStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    // ==========================================
    // WHISPER MESSAGE RENDERING
    // ==========================================
    if (isWhisper) {
        newMsg.classList.add('whisper-msg');
        
        const label = document.createElement('div');
        label.className = 'whisper-label';
        label.innerText = '👻 Tap to reveal';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'whisper-content';
        contentDiv.appendChild(document.createTextNode(text));
        
        newMsg.appendChild(contentDiv);
        newMsg.appendChild(label);
        
        // Tap to reveal & Auto-destruct
        newMsg.onclick = function() {
            if (!newMsg.classList.contains('revealed')) {
                newMsg.classList.add('revealed');
                label.innerText = 'Auto-destructing...';
                
                setTimeout(() => {
                    newMsg.style.transition = 'opacity 0.5s, transform 0.5s';
                    newMsg.style.opacity = '0';
                    newMsg.style.transform = 'scale(0.8)';
                    setTimeout(() => newMsg.remove(), 500);
                    
                    // Delete from memory
                    const chatId = activeChatId;
                    if (chatId) {
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + chatId)) || [];
                        msgs = msgs.filter(m => m.msgId !== id);
                        localStorage.setItem('bapp_msgs_' + chatId, JSON.stringify(msgs));
                    }
                }, 5000);
            }
        };
        
        // Add to screen and stop rendering the normal message
        const spacer = document.getElementById('chat-spacer');
        if (spacer) msgBox.insertBefore(newMsg, spacer);
        else msgBox.appendChild(newMsg);
        msgBox.scrollTop = msgBox.scrollHeight;
        return; // Stop executing the rest of the function
    }
    // ==========================================

    if (replyData) {`;

if (html.includes(oldAppendStart)) {
    html = html.replace(oldAppendStart, newAppendStart);
    fs.writeFileSync('index.html', html);
    console.log('✅ Whisper rendering block injected at the top of appendMessage!');
} else {
    // Fallback if the spacing is slightly different in your exact file
    console.log('❌ Exact match failed. Trying regex...');
    const regex = /function appendMessage\(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false\) \{[\s\S]*?if \(replyData\) \{/;
    
    const fallbackInject = `function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (isWhisper) {
        newMsg.classList.add('whisper-msg');
        const label = document.createElement('div');
        label.className = 'whisper-label';
        label.innerText = '👻 Tap to reveal';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'whisper-content';
        contentDiv.appendChild(document.createTextNode(text));
        newMsg.appendChild(contentDiv);
        newMsg.appendChild(label);
        newMsg.onclick = function() {
            if (!newMsg.classList.contains('revealed')) {
                newMsg.classList.add('revealed');
                label.innerText = 'Auto-destructing...';
                setTimeout(() => {
                    newMsg.style.transition = 'opacity 0.5s, transform 0.5s';
                    newMsg.style.opacity = '0';
                    newMsg.style.transform = 'scale(0.8)';
                    setTimeout(() => newMsg.remove(), 500);
                    const chatId = activeChatId;
                    if (chatId) {
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + chatId)) || [];
                        msgs = msgs.filter(m => m.msgId !== id);
                        localStorage.setItem('bapp_msgs_' + chatId, JSON.stringify(msgs));
                    }
                }, 5000);
            }
        };
        const spacer = document.getElementById('chat-spacer');
        if (spacer) msgBox.insertBefore(newMsg, spacer);
        else msgBox.appendChild(newMsg);
        msgBox.scrollTop = msgBox.scrollHeight;
        return;
    }

    if (replyData) {`;
    
    html = html.replace(regex, fallbackInject);
    fs.writeFileSync('index.html', html);
    console.log('✅ Whisper rendering block injected via regex fallback!');
}
