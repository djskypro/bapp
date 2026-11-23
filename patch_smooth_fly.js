const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the Keyframes to simulate a flying arc with a tilt
const newKeyframes = `
  @keyframes flyUpFromInput {
    0% {
      transform: translateY(120px) scale(0.7) rotate(-6deg);
      opacity: 0;
    }
    50% {
      transform: translateY(-25px) scale(1.05) rotate(2deg);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1) rotate(0deg);
      opacity: 1;
    }
  }
`;

// Use regex to find the old keyframes and replace them
const keyframesRegex = /@keyframes flyUpFromInput \{[\s\S]*?\}\s*\}/;
html = html.replace(keyframesRegex, newKeyframes.trim());

// 2. Replace the animation timing to a smooth ease-out spring
const animRegex = /animation: flyUpFromInput [^;]*;/;
const newAnim = `animation: flyUpFromInput 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;`;
html = html.replace(animRegex, newAnim);

// 3. Ensure the timeout removes the class exactly after the animation ends
html = html.replace(/setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), \d+\);/g, "setTimeout(() => newMsg.classList.remove('fly-in'), 1550);");

fs.writeFileSync('index.html', html);
console.log('✅ Smooth flying transition with tilt applied!');
