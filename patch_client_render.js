const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Make sure image rendering handles /media/ URLs
const oldRender = `} else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('img_ref_')) {`;

const newRender = `} else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      img.style.maxWidth = '100%';
      img.style.borderRadius = '10px';
      
      if (text.startsWith('/media/') || text.startsWith('http')) {
          img.src = text; // Load directly from URL
      } else if (text.startsWith('img_ref_')) {`;

if (html.includes(oldRender)) {
    html = html.replace(oldRender, newRender);
    fs.writeFileSync('index.html', html);
    console.log('✅ Image rendering fixed to handle URLs!');
} else {
    console.log('❌ Could not find the render block.');
}
