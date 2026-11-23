const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const cinematicCSS = `
<style>
  /* CINEMATIC SCROLL - Only active when animations are ON */
  body:not(.no-animations) .messages {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Fade-up animation for messages as they appear */
  body:not(.no-animations) .msg {
    animation: fadeUpSmooth 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes fadeUpSmooth {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Smooth scroll for the chat list too */
  body:not(.no-animations) .chat-list {
    scroll-behavior: smooth;
  }
</style>
</head>`;

if (!html.includes('fadeUpSmooth')) {
    html = html.replace('</head>', cinematicCSS);
}

fs.writeFileSync('index.html', html);
console.log('✅ Cinematic scroll + fade-up animation added!');
