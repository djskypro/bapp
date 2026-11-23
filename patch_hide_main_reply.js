const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the CSS rule to force-hide it when on the main screen
const hideCSS = `
<style>
  /* If the main view is active, HIDE the reply badge completely */
  #main-view.active ~ #reply-preview {
    display: none !important;
  }
</style>
</head>
`;
if(!html.includes('#main-view.active ~ #reply-preview')) {
    html = html.replace('</head>', hideCSS);
}

// 2. Forcefully clear the reply box in goBack()
const oldGoBack = `function goBack() {`;
const newGoBack = `function goBack() {
    document.getElementById('reply-preview').style.display = 'none';
    currentReplyTo = null;`;
html = html.replace(oldGoBack, newGoBack);

fs.writeFileSync('index.html', html);
console.log('✅ Reply badge will no longer show up on the main chat screen!');
