const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add a unique console.log to each appendMessage function
const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function appendMessage(') || lines[i].includes('appendMessage = function(')) {
        count++;
        lines[i] = lines[i] + `\n    console.log("APPEND #${count} CALLED: isImage=" + isImage + ", text=" + text);`;
    }
}
html = lines.join('\n');
fs.writeFileSync('index.html', html);
console.log(`✅ Added debug logs to ${count} appendMessage functions!`);
