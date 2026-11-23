const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const brokenGhost = `<div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px;">                      <div>                                               <label style="font-size:16px; font-weight:bold; color:var(--text);">👻 Ghost Mode</label>       </div>                                                <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Read messages without sending blue ticks</div>                                </div>                                            <label class="switch">                              <input type="checkbox" id="ghost-mode-toggle" onchange="toggleGhostMode()">                         <span class="slider round"></span>              </label>`;

const fixedGhost = `<div class="toggle-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--search-bg); padding:15px; border-radius:12px; margin-bottom:15px;">\
      <div>\
        <label style="font-size:16px; font-weight:bold; color:var(--text);">👻 Ghost Mode</label>\
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Read messages without sending blue ticks</div>\
      </div>\
      <label class="switch">\
        <input type="checkbox" id="ghost-mode-toggle" onchange="toggleGhostMode()">\
        <span class="slider round"></span>\
      </label>\
    </div>`;

if (html.includes(brokenGhost)) {
    html = html.replace(brokenGhost, fixedGhost);
    fs.writeFileSync('index.html', html);
    console.log("✅ Ghost Mode row rebuilt perfectly!");
} else {
    console.log("❌ Could not find the exact broken block.");
}
