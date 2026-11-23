const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Hide the input box on the trivia popup
html = html.replace(
  'id="trivia-input-area" style="display:none; gap:10px; margin-top:5px;"',
  'id="trivia-input-area" style="display:none !important;"' // Force hide it completely
);

// 2. Intercept the main sendMessage function
// We need to find the sendMessage function and add our Trivia check right at the top.
const oldSendMessage = `function sendMessage() {
    console.log("GROUPS DB:", JSON.parse(localStorage.getItem('bapp_groups')));
    console.log("ACTIVE CHAT:", activeChatId);

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;`;

const newSendMessage = `function sendMessage() {
    console.log("GROUPS DB:", JSON.parse(localStorage.getItem('bapp_groups')));
    console.log("ACTIVE CHAT:", activeChatId);

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    // --- TRIVIA MAIN INPUT CHECK ---
    if (typeof isGameActive !== 'undefined' && isGameActive && currentTriviaAnswer) {
      if (text.toLowerCase() === currentTriviaAnswer) {
        // Correct answer!
        input.value = '';
        submitTriviaAnswer(text); // Trigger the win logic
        return; // Stop the message from sending to chat
      } else {
        // Wrong answer
        input.value = '';
        const status = document.getElementById('trivia-status');
        if (status) {
           const oldStatus = status.innerText;
           status.innerText = '❌ Wrong answer, try again!';
           setTimeout(() => { if(status.innerText === '❌ Wrong answer, try again!') status.innerText = oldStatus; }, 1500);
        }
        return; // Stop the message from sending to chat
      }
    }
    // -------------------------------`;

html = html.replace(oldSendMessage, newSendMessage);

// 3. Update submitTriviaAnswer to accept the text directly
const oldSubmit = `function submitTriviaAnswer() {
    const input = document.getElementById('trivia-answer-input');
    const answer = input.value.trim();
    if (!answer) return;`;

const newSubmit = `function submitTriviaAnswer(forcedText = null) {
    const input = document.getElementById('trivia-answer-input');
    const answer = forcedText || (input ? input.value.trim() : '');
    if (!answer) return;`;

html = html.replace(oldSubmit, newSubmit);

fs.writeFileSync('index.html', html);
console.log("✅ Trivia now uses the main chat input!");
