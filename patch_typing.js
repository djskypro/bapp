const fs = require('fs');

// 1. Backup
fs.copyFileSync('index.html', 'index_backup_7.html');

let html = fs.readFileSync('index.html', 'utf8');
const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
let js = html.substring(startScript + 8, endScript);

// 2. Add the typing event listener for the input box
const typingLogic = `
  let typingTimeout = null;
  document.getElementById('chat-input').addEventListener('input', function() {
    const to = activeChatId;
    if (!to || socket.readyState !== WebSocket.OPEN) return;

    // Send typing true signal
    socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: true }));

    // Clear previous timer
    clearTimeout(typingTimeout);

    // Set timer to stop typing after 2 seconds of no input
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
    }, 2000);
  });
`;

// Insert the typing logic right before the handleEnter function
js = js.replace('function handleEnter(e)', typingLogic + '\n  function handleEnter(e)');

// 3. Ensure we stop typing immediately when a message is sent
const oldSend = `const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
    if (text !== "" && socket.readyState === WebSocket.OPEN) {`;
const newSend = `const text = input.value.trim();
    const to = document.getElementById('chat-name').textContent.trim();
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      // Stop typing signal immediately
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
      clearTimeout(typingTimeout);
`;
js = js.replace(oldSend, newSend);

// 4. Make sure we stop typing when going back to home screen
const oldGoBack = `function goBack() {
    activeChatId = null;`;
const newGoBack = `function goBack() {
    if (activeChatId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing', to: activeChatId, from: myBappId, isTyping: false }));
    }
    clearTimeout(typingTimeout);
    activeChatId = null;`;
js = js.replace(oldGoBack, newGoBack);

html = html.substring(0, startScript) + '<script>' + js + '</script>' + html.substring(endScript + 9);
fs.writeFileSync('index.html', html);
console.log('Live Typing indicator activated!');
