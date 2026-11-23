const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the CSS animation timing and curve
const oldCSS = `
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(100px) scale(0.8);
      opacity: 0;
    }
    40% {
      transform: translateY(-15px) scale(1.02);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  .msg.fly-in {
    animation: flyUpFromInput 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
`;

const newCSS = `
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(150px) scale(0.7);
      opacity: 0;
    }
    60% {
      transform: translateY(-20px) scale(1.05);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  .msg.fly-in {
    /* Increased from 0.4s to 0.8s and tweaked the bounce curve */
    animation: flyUpFromInput 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
`;

if (html.includes(oldCSS)) {
    html = html.replace(oldCSS, newCSS);
} else {
    // Fallback if spacing is slightly different
    html = html.replace(/@keyframes flyUpFromInput \{[\s\S]*?\}/g, newCSS.split('.msg.fly-in')[0]);
    html = html.replace(/\.msg\.fly-in \{[\s\S]*?\}/g, '.msg.fly-in { animation: flyUpFromInput 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }');
}

// 2. Update the JS timeout so it doesn't cut off the animation early
const oldTimeout = `setTimeout(() => newMsg.classList.remove('fly-in'), 450);`;
const newTimeout = `setTimeout(() => newMsg.classList.remove('fly-in'), 850);`;
html = html.replace(oldTimeout, newTimeout);

fs.writeFileSync('index.html', html);
console.log('✅ Message fly animation slowed down to 0.8s for a noticeable bounce!');
