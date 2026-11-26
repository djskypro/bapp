
  
    });
  }

  // ==========================================
  // FORCE OVERRIDE: Offline Queue SendMessage
  // ==========================================
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    // Check connection
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Show on screen immediately
    if (typeof appendMessage === 'function') {
        appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');
    }
    
    input.value = ''; 
    // Snap the keyboard back open instantly after sending
    setTimeout(() => {
        const chatIn = document.getElementById('chat-input');
        const chatView = document.getElementById('chat-view');
        if (chatIn && chatView && chatView.classList.contains('active')) {
            chatIn.focus();
        }
    }, 10);

    // 2. Save to phone storage
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        if (typeof loadChatList === 'function') loadChatList();
    } catch(e) { console.error("Storage full"); }

    // Clear reply box
    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send NOW or QUEUE for later
    const isGroup = activeChatId.startsWith('group_');
    let groupMembers = [];
    if (isGroup) {
        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
        if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
    }
    
    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply,
        isGroup: isGroup,
        groupMembers: groupMembers
    };

    if (isConnected) {
        socket.send(JSON.stringify(payload));
    } else {
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        console.log("📩 Message queued. Will send when online.");
    }
  };

  // FORCE OVERRIDE: The Clock Icon for Pending Messages
  const originalAppend = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status, isImage, isVoice, msgId, replyData, isWhisper, isVideo) {
    console.log("APPEND #5 CALLED: isImage=" + isImage + ", text=" + text);
    originalAppend(text, type, timeStr, status, isImage, isVoice, msgId, replyData, isWhisper, isVideo);
    // If it's a pending message, find the last bubble and change its tick to a clock
    if (status === 'pending') {
        const msgBox = document.getElementById('chat-messages');
        if (msgBox && msgBox.lastElementChild) {
            const check = msgBox.lastElementChild.querySelector('.msg-status');
            if (check) check.innerText = '🕒';
        }
    }
  };

  // --- GBWhatsApp THEME ENGINE ---
  window.selectedBubbleColor = window.selectedBubbleColor || '#005c4b';

  function openThemeModal() {
    document.getElementById('theme-modal').style.display = 'flex';
    document.getElementById('custom-theme-color').value = window.selectedBubbleColor;
    setThemeColor(window.selectedBubbleColor);
  }
  
  function closeThemeModal() {
    document.getElementById('theme-modal').style.display = 'none';
  }

  function setThemeColor(color) {
    window.selectedBubbleColor = color;
    document.getElementById('theme-preview-bubble').style.background = color;
    document.getElementById('custom-theme-color').value = color;
    
    document.querySelectorAll('.color-swatch').forEach(s => {
        // Convert hex to RGB to check match safely
        let rgb = color;
        if(color.startsWith('#')) {
            let r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
            rgb = `rgb(${r}, ${g}, ${b})`;
        }
        
        if (s.style.background === rgb || s.style.backgroundColor === rgb) {
            s.style.border = '3px solid white';
            s.style.transform = 'scale(1.1)';
        } else {
            s.style.border = '2px solid transparent';
            s.style.transform = 'scale(1)';
        }
    });
  }

  function resetThemeColor() {
    setThemeColor('#005c4b'); // Default WhatsApp green
  }

  // ==========================================
  // FINAL FORCE OVERRIDE (Fixes all duplicates)
  // ==========================================
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';
    const currentColor = (myProfile && myProfile.bubbleColor) ? myProfile.bubbleColor : '#005c4b';

    // 1. Show on screen immediately
    window.appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, currentColor);
    input.value = ''; 
    // Snap the keyboard back open instantly after sending
    setTimeout(() => {
        const chatIn = document.getElementById('chat-input');
        const chatView = document.getElementById('chat-view');
        if (chatIn && chatView && chatView.classList.contains('active')) {
            chatIn.focus();
        }
    }, 10);

    // 2. Save to local memory
    try {
        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply, bubbleColor: currentColor });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) { console.error("Storage full"); }

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send
    const payload = {
        type: 'send_message',
        to: to,
        from: myBappId,
        text: text,
        msgId: msgId,
        replyData: reply,
        bubbleColor: currentColor
    };

    if (isConnected) {
        socket.send(JSON.stringify(payload));
    } else {
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        queue.push(payload);
        localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
    }
  };

  // Final override for appendMessage to guarantee the color applies
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {
    console.log("APPEND #6 CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    // APPLY COLOR
    if (bubbleColor && type === 'sent') { 
        newMsg.style.setProperty('background', bubbleColor, 'important'); 
        newMsg.style.setProperty('background-color', bubbleColor, 'important'); 
    }
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        quote.style.cursor = 'pointer';
        quote.style.pointerEvents = 'auto';
        quote.onclick = function() { if(replyData.msgId) scrollToMessage(replyData.msgId); };
        newMsg.appendChild(quote);
    }

    if (isImage) {
      // Check if it's a video URL
      if (text && text.startsWith('/media/') && text.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '250px'; video.style.width = 'auto';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
      } else {
          const img = document.createElement('img'); img.src = text; img.style.cursor = 'pointer';
          img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src, false); };
          newMsg.appendChild(img);
      }
    } else if (isVoice || (text && text.startsWith('data:audio'))) {
      const audio = document.createElement('audio'); audio.controls = true; audio.src = text; newMsg.appendChild(audio);
    } else {
      
      if (type === 'received' && typeof text === 'string' && text.length > 0 && !text.startsWith('data:')) {
          const textSpan = document.createElement('span');
          newMsg.appendChild(textSpan);
          
          const originalText = Array.from(text);
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>';
          let iteration = 0;
          
          textSpan.style.color = '#25D366';
          textSpan.style.fontFamily = 'monospace';
          textSpan.style.textShadow = '0 0 8px #25D366';
          
          const interval = setInterval(() => {
              textSpan.innerText = originalText.map((char, index) => {
                  if (index < iteration) return originalText[index];
                  if (char === ' ') return ' ';
                  return chars[Math.floor(Math.random() * chars.length)];
              }).join('');
              
              if (iteration >= originalText.length) {
                  clearInterval(interval);
                  textSpan.style.color = '';
                  textSpan.style.fontFamily = '';
                  textSpan.style.textShadow = '';
              }
              iteration += 1 / 3;
          }, 30);
      } else {
          newMsg.appendChild(document.createTextNode(text));
      }

    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');
      newMsg.appendChild(check);
    }
    
    if (typeof attachContextMenu === 'function' && !isDeleted) {
        attachContextMenu(newMsg, id, text, type === 'sent');
    }
    
    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };

  // --- CHAT OPTIONS MENU LOGIC ---
  
  
  
  function clearCurrentChat() {
    if (confirm("Clear all messages in this chat? This cannot be undone.")) {
        localStorage.removeItem('bapp_msgs_' + activeChatId);
        document.getElementById('chat-messages').innerHTML = '';
        if(typeof closeChatMenu === 'function') closeChatMenu();
        if(typeof loadChatList === 'function') loadChatList();
        if(typeof showToast === 'function') showToast("Chat cleared!");
    }
  }

  function deleteCurrentChat() {
    if (confirm("Delete this entire chat? This will remove it from your list.")) {
        // 1. Clear messages
        localStorage.removeItem('bapp_msgs_' + activeChatId);
        
        // 2. Remove from chat list
        let chats = JSON.parse(localStorage.getItem('bapp_chats')) || [];
        chats = chats.filter(id => id !== activeChatId);
        localStorage.setItem('bapp_chats', JSON.stringify(chats));
        
        // 3. Close menu and go home
        if(typeof closeChatMenu === 'function') closeChatMenu();
        if(typeof loadChatList === 'function') loadChatList();
        if(typeof goBack === 'function') goBack();
        
        if(typeof showToast === 'function') showToast("Chat deleted!");
    }
  }

  function closeChatMenu() {
    document.getElementById('chat-options-menu').style.display = 'none';
  }, 300); // Wait for animation to finish
  }

  function clearCurrentChat() {
    if(confirm("Delete all messages in this chat? This cannot be undone.")) {
      localStorage.removeItem('bapp_msgs_' + activeChatId);
      document.getElementById('chat-messages').innerHTML = '';
      loadChatList();
      closeChatMenu();
    }
  }

  function changeWallpaper(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      localStorage.setItem('bapp_wallpaper_' + activeChatId, base64);
      applyWallpaper(base64);
      closeChatMenu();
    };
    reader.readAsDataURL(file);
  }

  function applyWallpaper(base64) {
    const msgBox = document.getElementById('chat-messages');
    if (base64) {
      msgBox.style.backgroundImage = `url(${base64})`;
      msgBox.style.backgroundSize = 'cover';
      msgBox.style.backgroundPosition = 'center';
    } else {
      msgBox.style.backgroundImage = 'none';
    }
  }

  function promptChatColor() {
    const color = prompt("Enter a Hex color code (e.g., #ff0000 for red, #000000 for black):", "#005c4b");
    if (color) {
      localStorage.setItem('bapp_chat_color_' + activeChatId, color);
      alert("Chat color saved! New messages will use this color.");
      closeChatMenu();
    }
  }

  // Override openChat to apply the saved wallpaper when opening a chat
  const originalOpenChatMenu = window.openChat;
  window.openChat = function(id, profileObj) {
    originalOpenChatMenu(id, profileObj);
    
    // Apply wallpaper
    const savedWallpaper = localStorage.getItem('bapp_wallpaper_' + id);
    applyWallpaper(savedWallpaper);
  };

  // --- BULLETPROOF 3-DOT MENU LISTENER ---
  setTimeout(() => {
    const btn = document.getElementById('three-dot-btn');
    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = document.getElementById('chat-options-menu');
            if (menu) {
                menu.style.display = 'flex';
            } else {
                console.error("Menu HTML not found!");
            }
        });
    }
  }, 1000);

  // --- GLOBAL MENU FUNCTIONS ---
  window.openChatMenu = function() {
    const menu = document.getElementById('chat-options-menu');
    if (menu) {
        menu.style.display = 'flex';
    } else {
        alert("Menu HTML not found!");
    }
  };
  
  window.closeChatMenu = function() {
    const menu = document.getElementById('chat-options-menu');
    if (menu) menu.style.display = 'none';
  };
