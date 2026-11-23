const fs = require('fs');
let serverJs = fs.readFileSync('server.js', 'utf8');

// We look for the exact start and end strings
const startStr = "if (bappUsers.has(cleanTo)) {";
const endStr = "} else {";

const startIdx = serverJs.indexOf(startStr);
const endIdx = serverJs.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newServerLogic = `const targetWs = bappUsers.get(cleanTo);
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
                    console.log("⚠️ Ghost socket detected. Cleaning up...");
                    bappUsers.delete(cleanTo);
                }
            }

            if (delivered) {
                ws.send(JSON.stringify({ type: 'delivered_receipt', to: cleanTo }));
                console.log("✅ Delivered (Receipt Sent)");
            } else {`;
            
    // Replace the whole block safely
    serverJs = serverJs.substring(0, startIdx) + newServerLogic + serverJs.substring(endIdx + endStr.length);
    fs.writeFileSync('server.js', serverJs);
    console.log('✅ Server ghost socket fix applied perfectly!');
} else {
    console.log('❌ Could not find the start or end boundaries in server.js.');
}
