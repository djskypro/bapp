const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The explicit code to hide the badge and clear memory
const forceHide = `
        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];
`;

// 1. FIX TEXT & VOICE: Replace any existing cancelReply() calls with the raw DOM code
html = html.replace(/if \(typeof cancelReply === 'function'\) cancelReply\(\);/g, forceHide);

// 2. FIX IMAGES: Inject the clear code right after the image is appended
html = html.replace(
    "appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);",
    "appendMessage(base64Img, 'sent', now, 'sent', true, false, msgId, reply);\n" + forceHide
);

fs.writeFileSync('index.html', html);
console.log('✅ Forcefully hiding the reply badge immediately after sending Text, Voice, or Image!');
