const fs = require('fs');

// ==========================================
// 1. FIX SERVER (Ensure it forwards bubbleColor)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add bubbleColor to the destructured variables just in case
if(!serverJs.includes("bubbleColor } = data;")) {
    serverJs = serverJs.replace(
        "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo } = data;",
        "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor } = data;"
    );
}
// Ensure it's in the payload sent to the receiver
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                    }));",
    "isVideo: isVideo || false,\n                        bubbleColor: bubbleColor\n                    }));"
);
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                }));",
    "isVideo: isVideo || false,\n                    bubbleColor: bubbleColor\n                }));"
);
// Ensure it's saved in the offline DB
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                });",
    "isWhisper: isWhisper || false,\n                    bubbleColor: bubbleColor\n                });"
);
fs.writeFileSync('server.js', serverJs);

// ==========================================
// 2. FIX CLIENT (Apply color when sending)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// A. Fix sendMessage to pass the color into appendMessage
const oldSendRender = `appendMessage(text, 'sent', now, status, false, false, msgId, reply);`;
const newSendRender = `appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');`;
html = html.replace(oldSendRender, newSendRender);

// B. Fix Receive message to pass the color into appendMessage
// Use Regex to catch all instances in case of duplicates
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData, data\.isWhisper\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);"
);
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);"
);

// C. Fix saveProfile to ensure color is saved properly and UI updates
const oldSave = `myProfile.bubbleColor = window.selectedBubbleColor;`;
const newSave = `myProfile.bubbleColor = window.selectedBubbleColor || '#005c4b';`;
html = html.replace(oldSave, newSave);

// D. Fix openSettings to ensure the dot indicator shows the right color
const oldOpen = `window.selectedBubbleColor = myProfile.bubbleColor || '#005c4b';`;
const newOpen = `window.selectedBubbleColor = myProfile.bubbleColor || '#005c4b';\n    document.getElementById('settings-color-indicator').style.background = window.selectedBubbleColor;`;
html = html.replace(oldOpen, newOpen);

fs.writeFileSync('index.html', html);
console.log('✅ Theme colors will now apply instantly and send to the receiver!');
