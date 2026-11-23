const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBlockRegex = /\/\/ --- MATRIX DECRYPTION EFFECT ---[\s\S]*?(?=\} else \{\s*\/\/ Normal text for sent messages)/;

const newBlock = `// --- MATRIX DECRYPTION EFFECT (OPTIMIZED) ---
      if (type === 'received' && text.length > 0) {
        const textSpan = document.createElement('span');
        newMsg.appendChild(textSpan);
        
        const originalText = Array.from(text);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>';
        let iteration = 0;
        
        textSpan.style.color = 'var(--primary)';
        textSpan.style.fontFamily = 'monospace';
        
        const speed = 0.15; // Speed of decryption (higher is faster)
        const maxScramble = 15; // Max random characters at once for smoothness
        let lastTime = 0;
        
        function animateMatrix(time) {
          if (!lastTime) lastTime = time;
          const delta = time - lastTime;
          
          // Only update if enough time has passed (approx 30fps for the scramble)
          if (delta > 30) {
            let output = '';
            for (let i = 0; i < originalText.length; i++) {
              if (i < iteration) {
                output += originalText[i];
              } else if (originalText[i] === ' ') {
                output += ' ';
              } else if (i < iteration + maxScramble) {
                output += chars[Math.floor(Math.random() * chars.length)];
              } else {
                output += ' '; // Prevent massive CPU load by only scrambling near the cursor
              }
            }
            textSpan.innerText = output;
            iteration += speed;
            lastTime = time;
          }
          
          if (iteration < originalText.length) {
            requestAnimationFrame(animateMatrix);
          } else {
            textSpan.innerText = text;
            textSpan.style.color = '';
            textSpan.style.fontFamily = '';
          }
        }
        requestAnimationFrame(animateMatrix);
        
      `;

html = html.replace(oldBlockRegex, newBlock);
fs.writeFileSync('index.html', html);
console.log("✅ Matrix effect optimized!");
