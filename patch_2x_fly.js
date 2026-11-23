const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Double the travel distance and bounce height
const newKeyframes = `
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(250px) scale(0.4) rotate(-12deg);
      opacity: 0;
    }
    50% {
      transform: translateY(-50px) scale(1.1) rotate(6deg);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1) rotate(0deg);
      opacity: 1;
    }
  }
`;

// Replace the old keyframes
const keyframesRegex = /@keyframes flyUpFromInput \{[\s\S]*?\}\s*\}/;
html = html.replace(keyframesRegex, newKeyframes.trim());

// 2. Update the animation duration to exactly 2 seconds
const animRegex = /animation: flyUpFromInput [^;]*;/;
const newAnim = `animation: flyUpFromInput 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;`;
html = html.replace(animRegex, newAnim);

// 3. Update the timeout so the class doesn't get removed too early
html = html.replace(/setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), \d+\);/g, "setTimeout(() => newMsg.classList.remove('fly-in'), 2050);");

fs.writeFileSync('index.html', html);
console.log('✅ 2x Fly animation applied! Double distance, double bounce, 2 seconds.');
