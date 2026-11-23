const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the sphere animation to include a physical tumble
const oldSphereCSS = `/* The sphere itself will breathe/grow slightly */
    animation: breatheSphere 4s infinite alternate ease-in-out;`;

const newSphereCSS = `/* The sphere itself will breathe/grow slightly */
    animation: breatheSphere 4s infinite alternate ease-in-out, tumble 8s infinite linear;`;

html = html.replace(oldSphereCSS, newSphereCSS);

// 2. Update the texture animation to roll diagonally forward
const oldTextureCSS = `/* Roll the texture horizontally like a 3D globe */
    animation: rollGlobe 6s linear infinite;
  }`;

const newTextureCSS = `/* Roll the texture diagonally forward */
    animation: rollForward 3s linear infinite;
  }`;

html = html.replace(oldTextureCSS, newTextureCSS);

// 3. Replace the keyframes
const oldKeyframes = /\/\* By shifting the background position horizontally[\s\S]*?<\/style>/;

const newKeyframes = `
  /* Move the texture downwards and to the right */
  @keyframes rollForward {
    0% { background-position: 0px 0px, 15px 15px, 15px 15px, 0px 0px; }
    100% { background-position: 15px 30px, 30px 45px, 30px 45px, 15px 30px; }
  }

  /* Make the whole ball gently tumble/rotate */
  @keyframes tumble {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
</style>
`;

html = html.replace(oldKeyframes, newKeyframes);

fs.writeFileSync('index.html', html);
console.log('✅ Rolling ball animation applied!');
