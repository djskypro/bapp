const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add a debug log at the start of the LOCAL appendMessage function
const oldStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {
    const msgBox = document.getElementById('chat-messages');`;

const newStart = `  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {
    console.log("LOCAL APPEND CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');`;

if (html.includes(oldStart)) {
    html = html.replace(oldStart, newStart);
    fs.writeFileSync('index.html', html);
    console.log('✅ Debug log added to LOCAL appendMessage!');
} else {
    console.log('❌ Could not find the local appendMessage start.');
}
