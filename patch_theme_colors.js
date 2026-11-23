const fs = require('fs');

// ==========================================
// 1. UPDATE SERVER (Pass the custom color)
// ==========================================
let serverJs = fs.readFileSync('server.js', 'utf8');

// Add bubbleColor to the destructured data
serverJs = serverJs.replace(
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo } = data;",
    "const { to, from, text, isImage, isVoice, msgId, replyData, isWhisper, isVideo, bubbleColor } = data;"
);

// Add it to the online delivery payload
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                    }));",
    "isVideo: isVideo || false,\n                        bubbleColor: bubbleColor\n                    }));"
);
// Fallback for spacing
serverJs = serverJs.replace(
    "isVideo: isVideo || false\n                }));",
    "isVideo: isVideo || false,\n                    bubbleColor: bubbleColor\n                }));"
);
// Add to the offline DB payload
serverJs = serverJs.replace(
    "isWhisper: isWhisper || false\n                });",
    "isWhisper: isWhisper || false,\n                    bubbleColor: bubbleColor\n                });"
);
fs.writeFileSync('server.js', serverJs);


// ==========================================
// 2. UPDATE CLIENT UI (Settings Page)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Add the Color Picker to the Settings page (right before the Auto-Location toggle)
const colorPickerHTML = `
    <div class="input-group" style="margin-top: 15px;">
      <label>Chat Bubble Color</label>
      <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
        <input type="color" id="settings-bubble-color" style="width: 50px; height: 50px; padding: 0; border: none; border-radius: 50%; cursor: pointer; background: transparent;">
        <span style="color: var(--text-muted); font-size: 14px;">Pick your custom theme color</span>
      </div>
    </div>
`;
html = html.replace('<div class="toggle-row">', colorPickerHTML + '\n    <div class="toggle-row">');

// Update myProfile default to include a color
html = html.replace(
    "let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: myBappId, bio: '', phone: '', location: 'Unknown', autoLocation: false, avatar: 'https://ui-avatars.com/api/?name=' + myBappId.charAt(0) + '&background=random' };",
    "let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: myBappId, bio: '', phone: '', location: 'Unknown', autoLocation: false, bubbleColor: '#005c4b', avatar: 'https://ui-avatars.com/api/?name=' + myBappId.charAt(0) + '&background=random' };"
);

// Load the color when opening settings
html = html.replace(
    "document.getElementById('settings-avatar').src = myProfile.avatar;",
    "document.getElementById('settings-avatar').src = myProfile.avatar;\n    document.getElementById('settings-bubble-color').value = myProfile.bubbleColor || '#005c4b';"
);

// Save the color in saveProfile
html = html.replace(
    "myProfile.autoLocation = document.getElementById('settings-auto-location').checked;",
    "myProfile.autoLocation = document.getElementById('settings-auto-location').checked;\n    myProfile.bubbleColor = document.getElementById('settings-bubble-color').value;"
);

// ==========================================
// 3. UPDATE SEND MESSAGE (Include color)
// ==========================================
html = html.replace(
    "msgId: msgId,\n        replyData: reply\n    };",
    "msgId: msgId,\n        replyData: reply,\n        bubbleColor: myProfile.bubbleColor || '#005c4b'\n    };"
);
// Also update the local save logic so it persists on your phone
html = html.replace(
    "savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply });",
    "savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply, bubbleColor: myProfile.bubbleColor || '#005c4b' });"
);

// ==========================================
// 4. UPDATE APPENDMESSAGE (Render the color)
// ==========================================
html = html.replace(
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false) {",
    "function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {"
);
// Apply the inline style if a color exists
html = html.replace(
    "newMsg.className = 'msg ' + type;",
    "newMsg.className = 'msg ' + type;\n    if (bubbleColor && type === 'sent') newMsg.style.backgroundColor = bubbleColor;"
);

// ==========================================
// 5. UPDATE RECEIVE MESSAGE (Pass the color)
// ==========================================
// Update all savedMsgs.push for received messages to include bubbleColor
html = html.replace(
    /savedMsgs\.push\(\{ text: data\.text, type: 'received', time: now, isImage: data\.isImage, isVoice: data\.isVoice, msgId: data\.msgId, replyData: data\.replyData(, isWhisper: data\.isWhisper)? \}\);/g,
    "savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });"
);
// Update all appendMessage calls for received messages
html = html.replace(
    /appendMessage\(data\.text, 'received', now, '', data\.isImage, data\.isVoice, data\.msgId, data\.replyData(, data\.isWhisper)?\);/g,
    "appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, false, data.bubbleColor);"
);

// ==========================================
// 6. UPDATE OPENCHAT (Load old colored messages)
// ==========================================
html = html.replace(
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));",
    "savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper, m.isVideo, m.bubbleColor));"
);

fs.writeFileSync('index.html', html);
console.log('✅ Custom Chat Bubble Colors activated successfully!');
