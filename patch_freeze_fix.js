const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldCode = `    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';

    const reader = new FileReader();`;

const newCode = `    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';

    // --- FIX: CHECK FOR VIDEO FIRST TO PREVENT FREEZE ---
    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        pendingMediaBase64 = URL.createObjectURL(file); // Instant preview, no RAM overload
        
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
        
        sendBtn.disabled = false;
        sendBtn.style.background = '#25D366';
        sendBtn.style.color = 'black';
        return; // Stop here, skip the FileReader completely
    }
    // ----------------------------------------------------

    const reader = new FileReader();`;

if (html.includes(oldCode)) {
    html = html.replace(oldCode, newCode);
    fs.writeFileSync('index.html', html);
    console.log('✅ Video freeze fixed! Videos will no longer use FileReader.');
} else {
    console.log('❌ Could not find the exact code block.');
}
