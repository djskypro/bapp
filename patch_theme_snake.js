const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add snake theme variables to :root (Dark Mode)
html = html.replace(
  '--msg-sent: #005c4b; --msg-received: #202c33;',
  '--msg-sent: #005c4b; --msg-received: #202c33;\n    --snake-color: rgba(255, 255, 255, 0.15);\n    --snake-glow: rgba(255, 255, 255, 0.05);\n    --snake-inset: rgba(255, 255, 255, 0.1);'
);

// 2. Add snake theme variables to .light-mode (Light Mode)
html = html.replace(
  '--msg-sent: #dcf8c6; --msg-received: #ffffff;',
  '--msg-sent: #dcf8c6; --msg-received: #ffffff;\n    --snake-color: rgba(0, 0, 0, 0.15);\n    --snake-glow: rgba(0, 0, 0, 0.05);\n    --snake-inset: rgba(0, 0, 0, 0.1);'
);

// 3. Make .snake-bg use the theme background color
html = html.replace(
  'background-color: #000000; /* Pure black */',
  'background-color: var(--bg); /* Follows light/dark mode */'
);

// 4. Update .glow-ant to use the new CSS variables
// Replace the background-image block
const oldBgImage = `background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, rgba(255,255,255,0.15) 21%, rgba(255,255,255,0.15) 34%, transparent 35%, transparent);`;
      
const newBgImage = `background-image: 
      radial-gradient(circle at 50% 0, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 0 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 100% 50%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent),
      radial-gradient(circle at 50% 100%, transparent 20%, var(--snake-color) 21%, var(--snake-color) 34%, transparent 35%, transparent);`;

html = html.replace(oldBgImage, newBgImage);

// 5. Replace the hardcoded box-shadow
html = html.replace(
  'box-shadow: 0 0 50px rgba(255, 255, 255, 0.05), inset 0 0 40px rgba(255, 255, 255, 0.1);',
  'box-shadow: 0 0 50px var(--snake-glow), inset 0 0 40px var(--snake-inset);'
);

// 6. Fix the search bar background to match light mode as well
html = html.replace(
  'background: rgba(15, 15, 20, 0.95);',
  'background: var(--glass-bg);'
);

fs.writeFileSync('index.html', html);
console.log('✅ Theme-aware snake texture added!');
