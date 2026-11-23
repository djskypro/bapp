const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace the fadeUp animation with a slide-from-left animation
const oldKeyframe = `@keyframes fadeUpSmooth {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }`;

const newKeyframe = `@keyframes fadeUpSmooth {
    0% {
      opacity: 0;
      transform: translateX(-60px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }`;

if (html.includes(oldKeyframe)) {
    html = html.replace(oldKeyframe, newKeyframe);
    fs.writeFileSync('index.html', html);
    console.log('✅ Messages now slide in from the LEFT!');
} else {
    console.log('❌ Could not find the exact keyframe.');
}
