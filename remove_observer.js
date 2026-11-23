const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove the observer block
const startIdx = html.indexOf('  // --- BULLETPROOF VIDEO OBSERVER ---');
const endIdx = html.indexOf('</script>', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    html = html.substring(0, startIdx) + html.substring(endIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ Observer removed!');
} else {
    console.log('❌ Could not find observer block.');
}
