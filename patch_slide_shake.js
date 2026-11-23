const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Force-override the old animation with the new Slide + Friction Shake
const newCSS = `
<style>
  /* OVERRIDE OLD ANIMATION */
  @keyframes slideAndShake {
    0% { 
      transform: translateY(150px) scale(0.8); 
      opacity: 0; 
    }
    60% { 
      transform: translateY(-10px) scale(1.02); 
      opacity: 1; 
    }
    /* FRICTION SHAKE AT THE END */
    70% { 
      transform: translateY(5px) translateX(-5px) scale(1); 
    }
    75% { 
      transform: translateY(0) translateX(5px); 
    }
    80% { 
      transform: translateX(-4px); 
    }
    85% { 
      transform: translateX(4px); 
    }
    90% { 
      transform: translateX(-2px); 
    }
    95% { 
      transform: translateX(2px); 
    }
    100% { 
      transform: translateY(0) translateX(0) scale(1); 
    }
  }

  .msg.fly-in {
    animation: slideAndShake 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. Ensure the class is removed after the 1.2s animation finishes
html = html.replace(/setTimeout\(\(\) => newMsg\.classList\.remove\('fly-in'\), \d+\);/g, "setTimeout(() => newMsg.classList.remove('fly-in'), 1250);");

fs.writeFileSync('index.html', html);
console.log('✅ Slide and Shake animation forced!');
