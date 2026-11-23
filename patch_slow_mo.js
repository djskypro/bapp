const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the animation to 1.5s with a nice slow-down curve
const oldCSS = `  .msg.fly-in {
    /* Increased from 0.4s to 0.8s and tweaked the bounce curve */
    animation: flyUpFromInput 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }`;

const newCSS = `  .msg.fly-in {
    animation: flyUpFromInput 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }`;
html = html.replace(oldCSS, newCSS);

// Fallback in case comments are missing
html = html.replace(/animation: flyUpFromInput 0\.8s[^;]*;/g, 'animation: flyUpFromInput 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;');

// 2. Update the timeout so the class isn't removed before the animation ends
html = html.replace(/setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), 850\);/g, "setTimeout(() => newMsg.classList.remove('fly-in'), 1550);");

fs.writeFileSync('index.html', html);
console.log('✅ Animation slowed to 1.5 seconds for maximum visibility!');
