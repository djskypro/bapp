
  let currentReplyTo = null;
  let activeMsgElement = null;

  // 1. Add Long-Press Logic to Messages
  
  
  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      // Scroll to the message smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add the green highlight
      target.classList.add('highlight-flash');
      
      // Remove the highlight after 3 seconds
      setTimeout(() => {
        target.classList.remove('highlight-flash');
      }, 30000);
    }
  }

  function attachContextMenu(el, msgId, text, isMe) {
    el.dataset.msgId = msgId;
    el.dataset.msgText = text;
    el.dataset.isMe = isMe;

    let startX = 0;
    let currentX = 0;
    let startY = 0;
    let isSwiping = false;
    let pressTimer;

    // --- POINTER DOWN ---
    el.addEventListener('pointerdown', (e) => {
      // Don't trigger swipe if tapping a button (like play audio)
      if (e.target.closest('.wa-play-btn') || e.target.tagName === 'AUDIO') return;

      startX = e.clientX;
      startY = e.clientY;
      isSwiping = false;
      el.classList.add('swiping');

      // Fallback: Long press still opens the menu for Delete/Copy
      pressTimer = setTimeout(() => {
        if (!isSwiping) showContextMenu(e.clientX, e.clientY, el);
      }, 600);
    });

    // --- POINTER MOVE ---
    el.addEventListener('pointermove', (e) => {
      if (startX === 0) return;
      
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;

      // If moving horizontally more than vertically, it's a swipe
      if (Math.abs(diffX) > Math.abs(diffY) && diffX > 10) {
        isSwiping = true;
        clearTimeout(pressTimer); // Cancel long press
        
        // Only allow swiping right (positive diffX) up to 80px
        if (diffX > 0 && diffX < 80) {
          el.style.transform = `translateX(${diffX}px)`;
        }
      }
    });

    // --- POINTER UP ---
    el.addEventListener('pointerup', (e) => {
      clearTimeout(pressTimer);
      el.classList.remove('swiping');

      if (isSwiping) {
        const diffX = e.clientX - startX;
        
        // Snap back to original position
        el.style.transform = `translateX(0px)`;
        
        // If swiped far enough to the right, trigger reply
        if (diffX > 50) {
          activeMsgElement = el; // Set the global active element
          executeReply();
        }
        
        startX = 0; // Reset
      } else {
        el.style.transform = `translateX(0px)`;
        startX = 0;
      }
    });

    // --- POINTER CANCEL ---
    el.addEventListener('pointercancel', () => {
      clearTimeout(pressTimer);
      el.classList.remove('swiping');
      el.style.transform = `translateX(0px)`;
      startX = 0;
    });

    // --- RIGHT CLICK (Desktop fallback) ---
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, el);
    });
  }

  function showContextMenu(x, y, el) {
    activeMsgElement = el;
    const menu = document.getElementById('msg-context-menu');
    menu.style.display = 'flex';
    menu.style.left = Math.min(x, window.innerWidth - 150) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 150) + 'px';
    
    // Hide Delete if it's not my message
    const delBtn = menu.querySelector('.delete');
    if (el.dataset.isMe === 'true') delBtn.style.display = 'flex';
    else delBtn.style.display = 'none';
  }

  // Hide menu on tap anywhere else
  document.addEventListener('pointerdown', (e) => {
    const menu = document.getElementById('msg-context-menu');
    if (menu && menu.style.display === 'flex' && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  
  function scrollToMessage(msgId) {
    if(!msgId) return;
    const target = document.getElementById('msg-' + msgId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash Green
      target.style.transition = 'background-color 0.3s';
      target.style.backgroundColor = 'rgba(37, 211, 102, 0.8)';
      
      setTimeout(() => {
        target.style.backgroundColor = ''; // Revert to normal
      }, 2000);
    } else {
      console.log("Original message not found on screen.");
    }
  }

  function executeReply() {
    const el = activeMsgElement;
    const text = el.dataset.msgText;
    const isMe = el.dataset.isMe === 'true';
    
    currentReplyTo = {
      msgId: el.dataset.msgId,
      text: text,
      name: isMe ? 'You' : document.getElementById('chat-name').textContent
    };
    window.replyState[activeChatId] = currentReplyTo; // Save to memory
    
    document.getElementById('reply-preview').style.display = 'block';
    document.getElementById('reply-preview-name').innerText = 'Replying to ' + currentReplyTo.name;
    document.getElementById('reply-preview-text').innerText = text.startsWith('data:image') ? '📷 Photo' : (text.startsWith('data:audio') ? '🎤 Voice Note' : text);
    
    document.getElementById('msg-context-menu').style.display = 'none';
    document.getElementById('chat-input').focus();
  }

  function cancelReply() {
    currentReplyTo = null;
    if (window.replyState) delete window.replyState[activeChatId]; // Delete from memory
    document.getElementById('reply-preview').style.display = 'none';
  }

  function executeCopy() {
    navigator.clipboard.writeText(activeMsgElement.dataset.msgText);
    showToast("Copied to clipboard!");
    document.getElementById('msg-context-menu').style.display = 'none';
  }

  function executeDelete() {
    const el = activeMsgElement;
    const msgId = el.dataset.msgId;
    const to = activeChatId;
    
    // 1. GHOST DELETE LOCALLY (Instantly remove the bubble from screen)
    if (el) {
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200); 
    }
    
    // 2. Send to server to delete on the OTHER person's phone
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ghost_delete', to: to, from: myBappId, msgId: msgId }));
    }
    
    // 3. Remove from local storage so it never comes back on refresh
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
    msgs = msgs.filter(m => m.msgId !== msgId);
    localStorage.setItem('bapp_msgs_' + to, JSON.stringify(msgs));
    
    document.getElementById('msg-context-menu').style.display = 'none';
  }

  // 2. Override appendMessage to support Reply & Delete
  const originalAppendForReply = window.appendMessage;
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isDeleted = false) {
    console.log("APPEND #4 CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    const id = msgId || Date.now().toString();
    
    if (isDeleted || text === 'DELETED') {
        newMsg.innerHTML = '<span class="msg-deleted">🚫 This message was deleted</span>';
        newMsg.style.background = 'var(--search-bg)';
    } else {
        // Render Reply Block
        if (replyData) {
          const quote = document.createElement('div');
          quote.className = 'quoted-msg';
          quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
          newMsg.appendChild(quote);
        }

        if (isImage) {
          const img = document.createElement('img');
      img.src = text;
      img.style.cursor = 'pointer';
      img.onclick = function(e) { e.stopPropagation(); openFullscreenMedia(this.src); };
      newMsg.appendChild(img);
        } else if (isVoice || (text && text.startsWith('data:audio'))) {
          // BUILD THE WHATSAPP PLAYER
          const playerDiv = document.createElement('div');
          playerDiv.className = 'wa-audio';
          
          const playBtn = document.createElement('div');
          playBtn.className = 'wa-play-btn';
          playBtn.innerText = '▶';
          
          const waveDiv = document.createElement('div');
          waveDiv.className = 'wa-waveform';
          
          const timeSpan = document.createElement('span');
          timeSpan.className = 'wa-time';
          timeSpan.innerText = '0:00';
          
          const dlBtn = document.createElement('div');
          dlBtn.className = 'wa-play-btn';
          dlBtn.innerHTML = '⬇️';
          dlBtn.style.marginLeft = '5px';
          dlBtn.style.fontSize = '14px';
          dlBtn.onclick = function() {
            const a = document.createElement('a');
            a.href = text;
            a.download = 'BAPP_Audio_' + Date.now() + '.webm';
            a.click();
          };
          
          const numBars = 25;
          const bars = [];
          for(let i=0; i<numBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'wa-bar';
            bar.style.height = (20 + Math.random() * 80) + '%'; 
            waveDiv.appendChild(bar);
            bars.push(bar);
          }
          
          playerDiv.appendChild(playBtn);
          playerDiv.appendChild(waveDiv);
          playerDiv.appendChild(timeSpan);
          playerDiv.appendChild(dlBtn);
          
          const audio = document.createElement('audio');
          audio.src = text;
          audio.preload = 'auto';
          audio.style.position = 'absolute';
          audio.style.width = '1px'; audio.style.height = '1px';
          audio.style.opacity = '0'; audio.style.pointerEvents = 'none';
          
          playerDiv.appendChild(audio);
          newMsg.appendChild(playerDiv);
          
          let isPlaying = false;
          playBtn.onclick = async function() {
            if (isPlaying) {
              audio.pause();
              playBtn.innerText = '▶';
              isPlaying = false;
            } else {
              try {
                await audio.play();
                playBtn.innerText = '⏸';
                playBtn.classList.add('played');
                isPlaying = true;
              } catch (err) { alert("Playback failed"); }
            }
          };
          
          audio.onended = function() {
            playBtn.innerText = '▶';
            isPlaying = false;
          };
          
          audio.ontimeupdate = function() {
            const mins = Math.floor(audio.currentTime / 60);
            const secs = Math.floor(audio.currentTime % 60);
            timeSpan.innerText = mins + ':' + secs.toString().padStart(2, '0');
            const progress = audio.currentTime / (audio.duration || 1);
            const playedBars = Math.floor(progress * numBars);
            bars.forEach((b, i) => {
              if (i < playedBars) b.classList.add('played');
              if (audio.currentTime === 0) b.classList.remove('played');
            });
          };
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
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent' && !isDeleted) {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');
      newMsg.appendChild(check);
    }
    
    // Attach long press logic
    if (!isDeleted) {
        attachContextMenu(newMsg, id, text, type === 'sent');
    }
    
    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };

  // 3. Update Send Message to include Reply & ID
  const originalSend = window.sendMessage;
  window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    const to = activeChatId;
    
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const msgId = Date.now().toString();
      
      socket.send(JSON.stringify({ 
          type: 'send_message', to: to, from: myBappId, text: text, isGroup: activeChatId.startsWith('group_'), groupMembers: (function() { let g = JSON.parse(localStorage.getItem('bapp_groups')) || {}; return g[activeChatId] ? g[activeChatId].members : []; })(), 
          msgId: msgId, replyData: currentReplyTo 
      }));
      
      appendMessage(text, 'sent', now, 'sent', false, false, msgId, currentReplyTo, false, false, myProfile.bubbleColor || '#005c4b');
      input.value = ''; 
    // Snap the keyboard back open instantly after sending
    setTimeout(() => {
        const chatIn = document.getElementById('chat-input');
        const chatView = document.getElementById('chat-view');
        if (chatIn && chatView && chatView.classList.contains('active')) {
            chatIn.focus();
        }
    }, 10);
      
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
      savedMsgs.push({ text: text, type: 'sent', time: now, status: 'sent', msgId: msgId, replyData: currentReplyTo });
      localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
      
      cancelReply();
      loadChatList();
    }
  };
