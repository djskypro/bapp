const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

const oldServerLogic = `            if (bappUsers.has(cleanTo)) {
                bappUsers.get(cleanTo).send(JSON.stringify({
                    type: 'new_message',
                    from: from,
                    text: text,
                    isImage: isImage || false,
                    isVoice: isVoice || false,
                    msgId: msgId,
                    replyData: replyData,
                    isWhisper: isWhisper || false,
                    isVideo: isVideo || false
                }));
                // Send confirmation back to sender
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered (Receipt Sent)");
            } else {`;

const newServerLogic = `            const targetWs = bappUsers.get(cleanTo);
            let delivered = false;

            // Check if the user exists AND the socket is actually open (readyState 1)
            if (targetWs && targetWs.readyState === 1) {
                try {
                    targetWs.send(JSON.stringify({
                        type: 'new_message',
                        from: from,
                        text: text,
                        isImage: isImage || false,
                        isVoice: isVoice || false,
                        msgId: msgId,
                        replyData: replyData,
                        isWhisper: isWhisper || false,
                        isVideo: isVideo || false
                    }));
                    delivered = true;
                } catch (err) {
                    console.log("⚠️ Ghost socket detected. Sending to offline DB instead.");
                    bappUsers.delete(cleanTo); // Remove the dead socket
                }
            }

            if (delivered) {
                // Send confirmation back to sender
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered to online user (Receipt Sent)");
            } else {`;

if (serverJs.includes(oldServerLogic)) {
    serverJs = serverJs.replace(oldServerLogic, newServerLogic);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server ghost socket fix applied!');
} else {
    console.log('❌ Could not find the exact server logic block.');
}
