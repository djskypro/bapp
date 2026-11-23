const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the trigger function globally
const triggerJS = `
  function triggerInputDrop() {
      const inputArea = document.querySelector('.chat-input-area');
      if (inputArea) {
          inputArea.classList.add('input-drop-anim');
          setTimeout(() => inputArea.classList.remove('input-drop-anim'), 400);
      }
  }
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + triggerJS + html.substring(lastScriptIdx);
}

// 2. Find the exact `input.value = '';` inside sendMessage and add the trigger
const sendStart = html.indexOf('function sendMessage() {');
if (sendStart !== -1) {
    // Find the first occurrence of input.value = '' after sendMessage starts
    const clearIdx = html.indexOf("input.value = '';", sendStart);
    if (clearIdx !== -1) {
        // Insert the trigger right after it
        const insertPos = clearIdx + "input.value = '';".length;
        html = html.substring(0, insertPos) + "\n    triggerInputDrop();\n" + html.substring(insertPos);
        console.log('✅ Input drop trigger injected into sendMessage!');
    } else {
        console.log('❌ Could not find input.value clear in sendMessage.');
    }
} else {
    console.log('❌ Could not find sendMessage function.');
}

fs.writeFileSync('index.html', html);
console.log('✅ Patch complete.');
