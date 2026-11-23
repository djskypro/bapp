const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldMenu = `  <div id="msg-context-menu">
    <div class="ctx-item" onclick="executeReply()">↩️ Reply</div>`;

const newMenu = `  <div id="msg-context-menu">
    <!-- REACTION BAR -->
    <div style="display:flex; justify-content:space-around; padding:10px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:5px;">
      <span onclick="addReaction('❤️')" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">❤️</span>
      <span onclick="addReaction('😂')" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">😂</span>
      <span onclick="addReaction('👍')" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">👍</span>
      <span onclick="addReaction('😮')" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">😮</span>
      <span onclick="addReaction('😢')" style="font-size:24px; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">😢</span>
    </div>

    <div class="ctx-item" onclick="executeReply()">↩️ Reply</div>`;

html = html.replace(oldMenu, newMenu);
fs.writeFileSync('index.html', html);
console.log("✅ Reaction UI added to context menu!");
