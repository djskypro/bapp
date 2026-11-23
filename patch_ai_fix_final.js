const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. FIX: Clear the input box when switching chats
const oldOpenChatStart = `function openChat(id, profileObj) {
    history.pushState({ view: 'chat' }, '', '#chat');`;

const newOpenChatStart = `function openChat(id, profileObj) {
    document.getElementById('chat-input').value = ''; // <--- CLEAR INPUT ON CHAT SWITCH
    history.pushState({ view: 'chat' }, '', '#chat');`;

html = html.replace(oldOpenChatStart, newOpenChatStart);

// 2. FIX: Force the AI to trigger the input event before sending
const oldAISend = `      if (actionType === 'message') {
        speakBappAI("Sending message to " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            document.getElementById('chat-input').value = messageText;
            sendMessage();
        }, 800); // Wait for chat to open
      }`;

const newAISend = `      if (actionType === 'message') {
        speakBappAI("Sending message to " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            input.value = messageText;
            
            // TRIGGER THE INPUT EVENT so the UI knows text was added
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Wait a tiny bit for the UI to catch up, then send
            setTimeout(() => {
                sendMessage();
            }, 150);
        }, 500); // Wait for chat to open
      }`;

if (html.includes(oldAISend)) {
    html = html.replace(oldAISend, newAISend);
    fs.writeFileSync('index.html', html);
    console.log('✅ AI will now send messages and clear drafts when switching chats!');
} else {
    console.log('❌ Could not find the exact AI send block.');
}
