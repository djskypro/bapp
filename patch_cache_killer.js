const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove old SW registration and force update
html = html.replace(/navigator\.serviceWorker\.register\('\/sw\.js'\)/g, `navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({type: 'SKIP_WAITING'});
    })`);

fs.writeFileSync('index.html', html);
console.log('✅ Cache killer added!');
