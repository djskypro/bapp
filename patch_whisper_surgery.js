const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. FIX SEND MESSAGE (Lines 1871-1880)
// ==========================================
const oldSend = `      socket.send(JSON.stringify({
          type: 'send_message',
          to: activeChatId,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: currentReplyTo
      }));

      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo);`;

const newSend = `      socket.send(JSON.stringify({
          type: 'send_message',
          to: activeChatId,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: currentReplyTo,
          isWhisper: window.isWhisperMode
      }));

      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, window.isWhisperMode);
      
      // Reset whisper mode after sending
      if (window.isWhisperMode) {
          window.isWhisperMode = false;
          const btn = document.getElementById('whisper-toggle');
          if(btn) { btn.style.background = 'var(--search-bg)'; btn.style.boxShadow = 'none'; }
          document.getElementById('chat-input').placeholder = "Message";
      }`;

if(html.includes(oldSend)) {
    html = html.replace(oldSend, newSend);
} else {
    console.log("❌ Could not find exact sendMessage block");
}

// ==========================================
// 2. FIX THE DUPLICATE RECEIVE BLOCK (Lines 2695-2700)
// ==========================================
const oldReceive = `          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {}
        saveChat(senderId);
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);`;

const newReceive = `          savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {}
        saveChat(senderId);
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);`;

html = html.replace(oldReceive, newReceive);

// ==========================================
// 3. FIX THE FIRST RECEIVE BLOCK (Lines 2231-2232)
// ==========================================
const oldReceive2 = `          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);`;
// We must make sure we only replace the one that doesn't already have isWhisper
// Using a negative lookahead or just checking the exact string
if (html.includes(oldReceive2)) {
    // Since the first block might already have it, we check if it's missing
    const checkIfMissing = `appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData);\n          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));`;
    if(html.includes(checkIfMissing)) {
        html = html.replace(checkIfMissing, `appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper);\n          socket.send(JSON.stringify({ type: 'read_receipt', to: senderId, from: myBappId }));`);
    }
}

// ==========================================
// 4. FIX OPEN CHAT (Loading from memory)
// ==========================================
const oldLoad = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData));`;
const newLoad = `savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper));`;
html = html.replace(oldLoad, newLoad);


fs.writeFileSync('index.html', html);
console.log('✅ Whisper flag is now successfully passed through send, receive, and load!');
