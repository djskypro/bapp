const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the new Materialize CSS
const newCSS = `
<style>
  /* The message bubble popping into existence */
  @keyframes materialize {
    0% { 
      transform: scale(0) translateY(50px); 
      opacity: 0; 
    }
    60% { 
      transform: scale(1.08) translateY(-5px); 
      opacity: 1; 
    }
    100% { 
      transform: scale(1) translateY(0); 
      opacity: 1; 
    }
  }

  .msg.materialize-in {
    animation: materialize 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
    transform-origin: bottom right;
  }

  /* The text box shrinking effect */
  @keyframes shrinkBox {
    0% { transform: scale(1); }
    50% { transform: scale(0.85); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }

  .chat-input-area.shrink-animation {
    animation: shrinkBox 0.3s ease-out;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. Remove the old fly-in CSS (if it exists) to prevent conflicts
html = html.replace(/@keyframes flyUpFromInput \{[\s\S]*?\}\s*\}/g, '');
html = html.replace(/\.msg\.fly-in \{[\s\S]*?\}/g, '');

// 3. Update appendMessage to use the new materialize class
const oldAnimBlock = `    // --- FLY ANIMATION FOR SENT MESSAGES ---
    if (type === 'sent') {
        newMsg.classList.add('fly-in');
        setTimeout(() => newMsg.classList.remove('fly-in'), 1550); 
    }`;

const newAnimBlock = `    // --- MATERIALIZE ANIMATION FOR SENT MESSAGES ---
    if (type === 'sent') {
        newMsg.classList.add('materialize-in');
        setTimeout(() => newMsg.classList.remove('materialize-in'), 500); 
    }`;

// Fallback regex if exact spacing is different
if (html.includes(oldAnimBlock)) {
    html = html.replace(oldAnimBlock, newAnimBlock);
} else {
    html = html.replace(
        "if (type === 'sent') {\n        newMsg.classList.add('fly-in');",
        "if (type === 'sent') {\n        newMsg.classList.add('materialize-in');"
    );
    html = html.replace(
        /setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), \d+\);/g,
        "setTimeout(() => newMsg.classList.remove('materialize-in'), 500);"
    );
}

// 4. Add the shrink effect to the sendMessage function
const oldInputClear = `input.value = '';`;
const newInputClear = `input.value = ''; 
    
    // SHRINK THE INPUT BOX
    const inputArea = document.querySelector('.chat-input-area');
    if (inputArea) {
        inputArea.classList.add('shrink-animation');
        setTimeout(() => inputArea.classList.remove('shrink-animation'), 300);
    }`;

// Only replace the first instance inside sendMessage to avoid breaking other inputs
const sendStart = html.indexOf('function sendMessage() {');
const sendEnd = html.indexOf('}', sendStart);
let sendBlock = html.substring(sendStart, sendEnd);
sendBlock = sendBlock.replace(oldInputClear, newInputClear);
html = html.substring(0, sendStart) + sendBlock + html.substring(sendEnd);

fs.writeFileSync('index.html', html);
console.log('✅ Shrink & Materialize animation added successfully!');
