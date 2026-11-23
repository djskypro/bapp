const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the 3-dot button to have an ID and remove inline onclick
const oldButton = `<span onclick="openChatMenu()" style="font-weight:bold; cursor:pointer;">⋮</span>`;
const newButton = `<span id="three-dot-btn" style="font-weight:bold; cursor:pointer;">⋮</span>`;
html = html.replace(oldButton, newButton);

// 2. Inject a bulletproof event listener at the end of the script
const clickListener = `
  // --- BULLETPROOF 3-DOT MENU LISTENER ---
  setTimeout(() => {
    const btn = document.getElementById('three-dot-btn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = document.getElementById('chat-options-menu');
            if (menu) {
                menu.style.display = 'flex';
            } else {
                console.error("Menu HTML not found!");
            }
        });
    }
  }, 1000);
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + clickListener + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ 3-Dot button click event forcefully attached!');
} else {
    console.log('❌ Could not find script tag.');
}
