const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Massive 5x travel distance, rotation, and scale
const newKeyframes = `
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(800px) scale(0.05) rotate(-45deg);
      opacity: 0;
    }
    50% {
      transform: translateY(-120px) scale(1.5) rotate(15deg);
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

// 2. Update the animation duration to a massive 4 seconds
const animRegex = /animation: flyUpFromInput [^;]*;/;
const newAnim = `animation: flyUpFromInput 4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;`;
html = html.replace(animRegex, newAnim);

// 3. Update the timeout so it doesn't get cut off
html = html.replace(/setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), \d+\);/g, "setTimeout(() => newMsg.classList.remove('fly-in'), 4050);");

fs.writeFileSync('index.html', html);
console.log('✅ 5x Cinematic Fly animation applied! Prepare for takeoff.');
