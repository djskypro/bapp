const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the "Shake to Undo" Toggle from Settings HTML
const undoHTML = `
    <div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:var(--search-bg); padding:15px; border-radius:12px;">
      <div style="font-size:14px;">Shake to Undo Send</div>
      <input type="checkbox" id="settings-shake-undo" style="width:20px; height:20px; accent-color:var(--primary);">
    </div>
`;
// Also try to remove it if it has different spacing (regex)
html = html.replace(/<div class="toggle-row"[^>]*>\s*<div[^>]*>Shake to Undo Send<\/div>\s*<input type="checkbox" id="settings-shake-undo"[^>]*>\s*<\/div>/g, '');
html = html.replace(undoHTML, '');

// 2. Remove Undo logic from openSettings and saveProfile
html = html.replace(/document\.getElementById\('settings-shake-undo'\)\.checked = [^;]+;/g, '');
html = html.replace(/window\.enableShakeToUndo = [^;]+;/g, '');
html = html.replace(/localStorage\.setItem\('bapp_shake_undo', [^)]+\);/g, '');

// 3. Remove the tracker from sendMessage
html = html.replace(/localStorage\.setItem\('bapp_last_sent', JSON\.stringify\(\{ to: activeChatId, msgId: msgId, time: Date\.now\(\) \}\)\);/g, '');
html = html.replace(/if \(typeof showToast === 'function'\) showToast\("📝 Message tracked for Undo!"\);/g, '');
html = html.replace(/const earlyMsgId = Date\.now\(\)\.toString\(\);/g, '');
html = html.replace(/try \{\s*localStorage\.setItem\('bapp_last_sent'[\s\S]*?\} catch\(e\) \{\s*alert\("⚠️ Storage Full! Cannot track message for Undo\."\);\s*\}/g, '');

// 4. Rewrite the Shake Listener to ONLY do the calculator
const startShake = html.indexOf("window.addEventListener('devicemotion', function(event) {");
const endShake = html.indexOf("});", startShake) + 3;

if (startShake !== -1 && endShake !== -1) {
    const simpleShakeLogic = `
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    if (force > 25 && (now - lastShake) > 2000) {
      lastShake = now;
      
      // Only Panic Mode exists now
      if (window.enablePanicMode) {
          document.getElementById('fake-calculator').style.display = 'flex';
      }
    }
  });
`;
    html = html.substring(0, startShake) + simpleShakeLogic + html.substring(endShake);
}

// 5. Clean up the initialization at the top
html = html.replace(/window\.enableShakeToUndo = localStorage\.getItem\('bapp_shake_undo'\) === 'true'; \/\/ Default false/g, '');

fs.writeFileSync('index.html', html);
console.log('✅ Shake to Undo removed. Panic Mode (Calculator) is untouched.');
