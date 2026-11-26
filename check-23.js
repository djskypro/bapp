
  let popupChatId = null;
  let popupTimeout = null;

  function showMessagePopup(senderName, messageText, chatId) {
    // Don't show if we are already in that chat
    if (typeof activeChatId !== 'undefined' && activeChatId === chatId) return;

    popupChatId = chatId;
    document.getElementById('msg-popup-avatar').innerText = senderName.charAt(0).toUpperCase();
    document.getElementById('msg-popup-name').innerText = senderName;
    document.getElementById('msg-popup-text').innerText = messageText;

    const popup = document.getElementById('msg-popup');
    popup.classList.add('show');

    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
      popup.classList.remove('show');
      document.getElementById('msg-popup-reply-area').style.display = 'none';
    }, 5000); // Hide after 4 seconds
  }

  
  function togglePopupReply(event) {
    event.stopPropagation();
    clearTimeout(popupTimeout); // Stop popup from hiding
    const replyArea = document.getElementById('msg-popup-reply-area');
    replyArea.style.display = 'block';
    document.getElementById('popup-reply-input').focus();
  }

  function sendQuickReply() {
    const input = document.getElementById('popup-reply-input');
    const text = input.value.trim();
    if (!text || !popupChatId) return;

    // Send the message
    if (typeof socket !== 'undefined' && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'send_message', to: popupChatId, from: myBappId, text: text,
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), msgId: 'msg_' + Date.now()
      };
      socket.send(JSON.stringify(payload));
      
      // Save locally to storage
      if (typeof saveMessage === 'function') {
        saveMessage(popupChatId, payload);
      } else {
        // Fallback if saveMessage isn't available
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + popupChatId)) || [];
        msgs.push({ text: text, type: 'sent', time: payload.timeStr, status: 'sent', msgId: payload.msgId });
        localStorage.setItem('bapp_msgs_' + popupChatId, JSON.stringify(msgs));
      }
      
      // If we are currently inside that chat, draw the bubble too
      if (typeof activeChatId !== 'undefined' && activeChatId === popupChatId && typeof appendMessage === 'function') {
        appendMessage(text, 'sent', payload.timeStr, 'sent', false, false, payload.msgId);
      }
      
      // Refresh the chat list so the last message updates
      if (typeof loadChatList === 'function') loadChatList();
    }

    // Reset popup
    input.value = '';
    document.getElementById('msg-popup').classList.remove('show');
    document.getElementById('msg-popup-reply-area').style.display = 'none';
    popupChatId = null;
  }

  
  document.addEventListener('click', function(event) {
    const replyArea = document.getElementById('msg-popup-reply-area');
    const popup = document.getElementById('msg-popup');
    const replyBtn = document.getElementById('popup-reply-btn');
    
    // If reply area is visible, and the click is not inside it, and not the reply button
    if (replyArea && replyArea.style.display === 'block') {
      if (!replyArea.contains(event.target) && event.target !== replyBtn && !replyBtn.contains(event.target)) {
        replyArea.style.display = 'none';
        // Reset the 5s timer so the popup doesn't vanish instantly while you're reading it
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
          popup.classList.remove('show');
        }, 5000);
      }
    }
  });

  const chatListContainer = document.getElementById("chat-list-container");
  if (chatListContainer) {
    chatListContainer.addEventListener("scroll", function() {
      const replyArea = document.getElementById("msg-popup-reply-area");
      if (replyArea && replyArea.style.display === "block") {
        replyArea.style.display = "none";
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
          document.getElementById("msg-popup").classList.remove("show");
        }, 5000);
      }
    });
  }

  function openPopupChat() {
    if (popupChatId) {
      document.getElementById('msg-popup').classList.remove('show');
      openChat(popupChatId);
      popupChatId = null;
    }
  }
