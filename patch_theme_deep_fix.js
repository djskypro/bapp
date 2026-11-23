const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Pass bubbleColor forward)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');
if(!serverJs.includes("bubbleColor } = data;")) {
    serverJs = serverJs.replace(
        "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo } = data;",
        "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor } = data;"
    );
}
// Ensure it's in the online delivery payload
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                    }));",
    "isVideo: isVideo || false,\n                        bubbleColor: bubbleColor\n                    }));"
);
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                }));",
    "isVideo: isVideo || false,\n                    bubbleColor: bubbleColor\n                }));"
);
// Ensure it's in the offline DB payload
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                });",
    "isWhisper: isWhisper || false,\n                    bubbleColor: bubbleColor\n                });"
);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Update all appendMessage calls)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Update all sent message calls that are missing the color
// Regex targets: appendMessage(text, 'sent', now, status, false, false, msgId, reply);
html = html.replace(
    /appendMessage\(text, 'sent', now, status, false, false, msgId, reply\);/g,
    "appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');"
);

// Regex targets: appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);
html = html.replace(
    /appendMessage\(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo\);/g,
    "appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, false, false, myProfile.bubbleColor || '#005c4b');"
);

// B. Update all received message calls that are missing the color
// Regex targets: appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);"
);

// C. Force the color application in appendMessage
html = html.replace(
    "if (bubbleColor && type === 'sent') { newMsg.style.setProperty('background-color', bubbleColor, 'important'); }",
    "if (bubbleColor && type === 'sent') { newMsg.style.setProperty('background', bubbleColor, 'important'); newMsg.style.setProperty('background-color', bubbleColor, 'important'); }"
);

fs.writeFileSync('index.html', html);
console.log('✅ All duplicate functions patched with bubbleColor!');
