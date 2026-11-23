const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We target the EXACT line that renders plain text, ignoring spacing
const textNodeRegex = /newMsg\.appendChild\(document\.createTextNode\(text\)\);/g;

const matrixCode = `
      if (type === 'received' && typeof text === 'string' && text.length > 0 && !text.startsWith('data:')) {
          const textSpan = document.createElement('span');
          newMsg.appendChild(textSpan);
          
          const originalText = Array.from(text);
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>';
          let iteration = 0;
          
          textSpan.style.color = '#25D366';
          textSpan.style.fontFamily = 'monospace';
          textSpan.style.textShadow = '0 0 8px #25D366';
          
          const interval = setInterval(() => {
              textSpan.innerText = originalText.map((char, index) => {
                  if (index < iteration) return originalText[index];
                  if (char === ' ') return ' ';
                  return chars[Math.floor(Math.random() * chars.length)];
              }).join('');
              
              if (iteration >= originalText.length) {
                  clearInterval(interval);
                  textSpan.style.color = '';
                  textSpan.style.fontFamily = '';
                  textSpan.style.textShadow = '';
              }
              iteration += 1 / 3;
          }, 30);
      } else {
          newMsg.appendChild(document.createTextNode(text));
      }
`;

if (html.match(textNodeRegex)) {
    html = html.replace(textNodeRegex, matrixCode);
    fs.writeFileSync('index.html', html);
    console.log('✅ Matrix Decryption effect activated successfully!');
} else {
    console.log('❌ Could not find the text node line. Aborting to prevent crash.');
}
