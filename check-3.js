
  
  // --- SAFE INDEXEDDB SETUP ---
  let bappDB;
  const dbRequest = indexedDB.open("BappMediaDB", 1);
  dbRequest.onupgradeneeded = function(e) {
      let db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images");
      }
  };
  dbRequest.onsuccess = function(e) {
      bappDB = e.target.result;
  };
  
  function saveImgToDB(id, base64) {
      return new Promise((resolve) => {
          if(!bappDB) {
              setTimeout(() => resolve(saveImgToDB(id, base64)), 100);
              return;
          }
          try {
              let tx = bappDB.transaction("images", "readwrite");
              let req = tx.objectStore("images").put(base64, id);
              req.onsuccess = function() { resolve(true); };
              req.onerror = function(e) { console.log("DB Save Error", e); resolve(false); };
          } catch(e) { console.log("DB Save Error", e); resolve(false); }
      });
  }
  
  function getImgFromDB(id, callback) {
      if(!bappDB) { 
          setTimeout(() => getImgFromDB(id, callback), 100);
          return; 
      }
      try {
          let tx = bappDB.transaction("images", "readonly");
          let req = tx.objectStore("images").get(id);
          req.onsuccess = function() { callback(req.result); };
          req.onerror = function() { callback(null); };
      } catch(e) { callback(null); }
  }

  
  window.enablePanicMode = localStorage.getItem('bapp_panic_mode') !== 'false';
  window.enableShakeToUndo = localStorage.getItem('bapp_shake_undo') === 'true';

  
  window.enableAnimations = localStorage.getItem('bapp_animations') !== 'false';
  if (!window.enableAnimations) document.body.classList.add('no-animations');

  let myBappId = localStorage.getItem('bapp_username');
  if (!myBappId || myBappId.trim() === "" || myBappId === "null") {
      document.getElementById('login-screen').style.display = 'flex';
      throw new Error("Auth required"); // Stop the rest of the script from running
  }
  document.getElementById('my-id').innerText = "Your ID: @" + myBappId;

  window.selectedBubbleColor = '#005c4b';
  let myProfile = JSON.parse(localStorage.getItem('bapp_profile')) || { name: myBappId, bio: '', phone: '', location: 'Unknown', autoLocation: false, bubbleColor: '#005c4b', avatar: 'https://ui-avatars.com/api/?name=' + myBappId.charAt(0) + '&background=random' };
  let autoLocationInterval = null;
  let activeChatId = null;
  window.replyState = {};

  let socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
  let reconnectTimer = null;
  // 1. Load the UI and chats instantly (works offline)
  loadChatList();
  document.getElementById('my-id').innerText = "Your ID: @" + myBappId;

  // 2. Connect to server when online
  socket.onopen = () => {
    console.log("✅ Connected to server.");
    const savedPass = localStorage.getItem('bapp_password');
            if (savedPass) {
                socket.send(JSON.stringify({ type: 'auth_request', username: myBappId, password: savedPass, isLogin: true }));
            } else {
                localStorage.removeItem('bapp_username');
                window.location.reload();
            }
    
    // FLUSH OFFLINE QUEUE
    let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
    if (queue.length > 0) {
        console.log(`📤 Sending ${queue.length} queued messages...`);
        queue.forEach(payload => {
            socket.send(JSON.stringify(payload));
        });
        localStorage.removeItem('bapp_offline_queue');
        
        // Update statuses in local memory to 'sent'
        queue.forEach(payload => {
            let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + payload.to)) || [];
            let m = msgs.find(msg => msg.msgId === payload.msgId);
            if (m) m.status = 'sent';
            localStorage.setItem('bapp_msgs_' + payload.to, JSON.stringify(msgs));
        });
        loadChatList();
    }
  };

  socket.onclose = () => {
    console.log("🔴 Disconnected from server. Trying to reconnect...");
    if (!reconnectTimer) {
        reconnectTimer = setTimeout(reconnectWebSocket, 3000);
    }
  };

  function reconnectWebSocket() {
    reconnectTimer = null;
    console.log("🔄 Attempting silent reconnect...");
    
    // Save the current message handler so we don't lose it
    const currentHandler = socket.onmessage;
    
    // Create a fresh socket
    socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    
    socket.onopen = () => {
        console.log("✅ Reconnected successfully!");
        let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
        if (queue.length > 0) {
            queue.forEach(payload => socket.send(JSON.stringify(payload)));
            localStorage.removeItem('bapp_offline_queue');
        }
        socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    };
    
    socket.onclose = () => {
        console.log("🔴 Disconnected again. Retrying...");
        if (!reconnectTimer) reconnectTimer = setTimeout(reconnectWebSocket, 3000);
    };
    
    socket.onerror = (err) => console.error("WebSocket Error: ", err);
    
    // Reattach all the message listeners we built earlier
    if (currentHandler) {
        socket.onmessage = currentHandler;
    }
  }

  
  // Listen for when the user comes back to the tab (fixes Android backgrounding)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log("👀 Tab focused again. Checking for missed messages...");
      // If the socket is closed or closing, force a reconnect
      if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (typeof reconnectWebSocket === 'function') reconnectWebSocket();
      } else if (socket.readyState === WebSocket.OPEN) {
        // If it's still open, ping the server to get any offline messages
        socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
      }
    }
  });

  // Listen for the phone's internet coming back
  window.addEventListener('online', () => {
    console.log("🌐 Network restored. Reconnecting instantly...");
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectWebSocket();
    }
  });

  socket.onerror = (err) => {
    console.error("WebSocket Error: ", err);
  };

  

  function getChats() { return JSON.parse(localStorage.getItem('bapp_chats')) || []; }
  function getUnreads() { return JSON.parse(localStorage.getItem('bapp_unreads')) || {}; }
  function saveChat(id) {
    let chats = getChats();
    if (!chats.includes(id)) { chats.unshift(id); localStorage.setItem('bapp_chats', JSON.stringify(chats)); }
  }

  function loadChatList() {
    const chatList = document.getElementById('chat-list-container');
    chatList.innerHTML = ''; 
    const chats = Object.keys(localStorage).filter(k => k.startsWith("bapp_msgs_")).map(k => k.replace("bapp_msgs_", ""));
    const unreads = getUnreads();
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    const searchVal = document.getElementById('search-input') ? document.getElementById('search-input').value.trim() : '';
    const visibleChats = chats.filter(id => {
       if (hiddenChats[id]) {
          return hiddenChats[id] === searchVal; // Only show if the search bar matches the PIN
       }
       return true;
    });
    
    visibleChats.forEach(id => {
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      let lastMsgText = 'Tap to chat';
      let lastMsgTime = '';
      
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        lastMsgTime = last.time || '';
        
        if (last.isImage) {
          lastMsgText = '📷 Photo';
        } else if (last.isVoice || (last.text && last.text.startsWith('data:audio'))) {
          lastMsgText = '🎤 Voice Note';
        } else {
          lastMsgText = last.text;
        }
      }
      
      let displayName = id;
      let avatarUrl = 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
      let isGroup = id.startsWith('group_');
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[id]) { displayName = groups[id].name; avatarUrl = 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff'; }
      } else {
          const p = profiles[id] || {};
          displayName = p.name || id;
          avatarUrl = p.avatar || avatarUrl;
      }
      
      const unreadCount = unreads[id] || 0;
      const badgeHtml = unreadCount > 0 ? `<div class="badge">${unreadCount}</div>` : '';
      const timeClass = unreadCount > 0 ? 'chat-time unread' : 'chat-time';

      const chatHtml = `
        <div class="chat-item" id="item-${id}" onclick="openChat('${id}')" oncontextmenu="event.preventDefault(); openChatListMenu('${id}');" ontouchstart="startChatHold(event, '${id}')" ontouchend="cancelChatHold()" ontouchmove="cancelChatHold()">
          <div class="avatar-wrapper" data-user-id="${id}">
            <img src="${avatarUrl}" class="avatar">
            <div class="online-ring" style="display: ${window.onlineUsers && window.onlineUsers.includes(id) ? 'block' : 'none'};"></div>
          </div>
          <div class="chat-info">
            <div class="chat-top"><div class="chat-name">${displayName}</div><div class="${timeClass}">${lastMsgTime}</div></div>
            <div class="chat-bottom"><div class="chat-msg" id="preview-${id}">${lastMsgText}</div>${badgeHtml}</div>
          </div>
        </div>
      `;
      chatList.insertAdjacentHTML('beforeend', chatHtml);
    });
    updateGlobalBadge();
  }

  function updateGlobalBadge() {
    const unreads = getUnreads();
    let total = 0;
    for (let id in unreads) total += unreads[id];
    const badge = document.getElementById('global-badge');
    if (total > 0) { badge.style.display = 'flex'; badge.innerText = total; } else { badge.style.display = 'none'; }
  }

  let searchTimeout = null;
  
  function checkHiddenPin() {
    const input = document.getElementById('search-input');
    const typedPin = input.value.trim();
    if (!typedPin) return;

    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    
    // Find the chat ID that matches this PIN
    let foundChatId = null;
    for (const chatId in hiddenChats) {
      if (hiddenChats[chatId] === typedPin) {
        foundChatId = chatId;
        break;
      }
    }

    if (foundChatId) {
      // Open the chat immediately!
      input.value = ''; // Clear search
      document.getElementById('search-dropdown').style.display = 'none'; // Hide dropdown
      openChat(foundChatId); // Open the chat
    }
  }

  function openHiddenChatsFromSearch() {    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};    const chatIds = Object.keys(hiddenChats);    if (chatIds.length > 0) {      document.getElementById('search-input').value = '';      document.getElementById('search-dropdown').style.display = 'none';      openChat(chatIds[0]);    }  }
  function handleSearchInput() {
    const input = document.getElementById('search-input');
    const query = input.value.trim().toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    const clearBtn = document.getElementById('clear-search');
    const blurOverlay = document.getElementById('search-blur-overlay');

    if (query.length === 0) {
      dropdown.style.display = 'none';
      clearBtn.style.display = 'none';
      blurOverlay.style.display = 'none';
      return;
      alert("Checking PIN: Typed [" + query + "] | Saved [" + globalPin + "]");
    }

    clearBtn.style.display = 'block';
    blurOverlay.style.display = 'block';

    // 1. Check for the Secret PIN
    const globalPin = localStorage.getItem('bapp_global_pin');
    if (globalPin && query === globalPin) {
      dropdown.style.display = "block";
      dropdown.innerHTML = "<div onclick=\"openHiddenChatsFromSearch()\" style=\"padding:15px; text-align:center; color:var(--primary); font-weight:bold; cursor:pointer; background:rgba(37,211,102,0.1); border-radius:10px; margin:5px;\">🔓 Open Hidden Chats</div>";
      return;
    }

    // 2. Search Local Messages
    let resultHTML = '';
    const chats = Object.keys(localStorage).filter(k => k.startsWith("bapp_msgs_")).map(k => k.replace("bapp_msgs_", ""));
    const hiddenChats = JSON.parse(localStorage.getItem('bapp_hidden_chats')) || {};
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};

    chats.forEach(id => {
      if (hiddenChats[id]) return; // Skip hidden chats in normal search
      
      const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
      const name = profiles[id] ? (profiles[id].name || id) : id;
      
      // Check if contact name matches
      const contactMatch = name.toLowerCase().includes(query);

      // Check if any message matches
      const matchingMsgs = msgs.filter(m => m.text && !m.text.startsWith('data:') && m.text.toLowerCase().includes(query));

      if (contactMatch || matchingMsgs.length > 0) {
        let msgsToShow = matchingMsgs.length > 0 ? matchingMsgs : msgs.slice(-1);
        
        msgsToShow.forEach(m => {
          resultHTML += `
            <div onclick="document.getElementById('search-dropdown').style.display='none'; document.getElementById('search-input').value=''; openChat('\${id}')" style="padding:12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:4px;">
              <div style="font-weight:bold; color:var(--primary); font-size:14px;">\${name}</div>
              <div style="color:#ccc; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${m.text || 'Media message'}</div>
            </div>
          `;
        });
      }
    });

    if (resultHTML !== '') {
      dropdown.innerHTML = resultHTML;
      dropdown.style.display = 'block';
    } else {
      // 3. Fallback to server search (users)
      dropdown.innerHTML = '<div style="padding:15px; text-align:center; color:#aaa;">No results found</div>';
      dropdown.style.display = 'block';
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if(socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'search_user', query: query, from: myBappId }));
        }
      }, 300);
    }
  }

  function selectSearchUser(userObj) {
    document.getElementById('search-dropdown').style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('search-blur-overlay').style.display = 'none'; // Turn off blur
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    profiles[userObj.username] = userObj.profile;
    localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
    saveChat(userObj.username);
    loadChatList();
    openChat(userObj.username, userObj.profile);
  }

  function openChat(id, profileObj) {
    document.getElementById('chat-input').value = ''; // <--- CLEAR INPUT ON CHAT SWITCH
    history.pushState({ view: 'chat' }, '', '#chat');
    // --- RESTORE REPLY STATE FOR THIS CHAT ---
    const replyBox = document.getElementById('reply-preview');
    if (window.replyState && window.replyState[id]) {
        currentReplyTo = window.replyState[id];
        if (replyBox) {
            replyBox.style.display = 'block';
            document.getElementById('reply-preview-name').innerText = 'Replying to ' + currentReplyTo.name;
            document.getElementById('reply-preview-text').innerText = currentReplyTo.text.startsWith('data:image') ? '📷 Photo' : (currentReplyTo.text.startsWith('data:audio') ? '🎤 Voice Note' : currentReplyTo.text);
        }
    } else {
        currentReplyTo = null;
        if (replyBox) replyBox.style.display = 'none';
    }
    // ---------------------------------------

    // FORCE HIDE REPLY BOX ON CHAT OPEN
    const rpBox = document.getElementById('reply-preview');
    if (rpBox && !currentReplyTo) rpBox.style.display = 'none';

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
    
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profileObj || profiles[id] || { name: id, avatar: 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random' };
    if (id.startsWith('group_')) { let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {}; if (groups[id]) { p = { name: groups[id].name, avatar: 'https://ui-avatars.com/api/?name=👥&background=25D366&color=fff' }; } }
    document.getElementById('chat-name').textContent = p.name || id;
    activeChatId = id.trim();
    document.getElementById('chat-avatar').src = p.avatar || 'https://ui-avatars.com/api/?name=' + id.substring(0,2) + '&background=random';
    document.getElementById('chat-subtitle').innerText = '🔒 End-to-End Encrypted';
    
    const msgBox = document.getElementById('chat-messages');
    msgBox.innerHTML = ""; 
    const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    savedMsgs.forEach(m => appendMessage(m.text, m.type, m.time, m.status, m.isImage, m.isVoice, m.msgId, m.replyData, m.isWhisper, m.isVideo, m.bubbleColor));
    
    let unreads = getUnreads();
    if(unreads[id]) { unreads[id] = 0; localStorage.setItem('bapp_unreads', JSON.stringify(unreads)); }
    safeSendReceipt(id);
    
    let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + id)) || [];
    msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
    localStorage.setItem('bapp_msgs_' + id, JSON.stringify(msgs));
    
    loadChatList();

    // --- RESTORE SCROLL POSITION OR SCROLL TO BOTTOM ---
    const savedScroll = localStorage.getItem('bapp_scroll_' + id);

    if (msgBox) {
      if (savedScroll !== null) {
        msgBox.scrollTop = parseInt(savedScroll);
      } else {
        msgBox.scrollTop = msgBox.scrollHeight;
      }
      msgBox.onscroll = function() {
        localStorage.setItem("bapp_scroll_" + id, msgBox.scrollTop);
      };
    }
        setTimeout(() => { if(msgBox) msgBox.scrollTop = parseInt(savedScroll); }, 100); setTimeout(() => { if(msgBox) msgBox.scrollTop = parseInt(savedScroll); }, 300); setTimeout(() => { if(msgBox) msgBox.scrollTop = parseInt(savedScroll); }, 600);
    if (savedScroll !== null) {
      // Restore where the user left off
      setTimeout(() => {
        if(msgBox) msgBox.scrollTop = parseInt(savedScroll);
      }, 50);
    } else {
      // First time opening this chat, scroll to bottom
      const scrollToBottom = () => {
          if(msgBox) msgBox.scrollTop = msgBox.scrollHeight;
      };
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
      setTimeout(scrollToBottom, 500);
      setTimeout(() => { msgBox.style.opacity = '1'; }, 50);
    }

    // Save scroll position continuously
    if (msgBox) {
      msgBox.onscroll = function() {
        localStorage.setItem('bapp_scroll_' + id, msgBox.scrollTop);
      };
    }
  }

  // This function resets the UI to the main screen
  function resetToHome() {
    activeChatId = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('main-view').classList.add('active');
  }

  // This function is called by your back buttons
  function goBack() {
    document.getElementById('reply-preview').style.display = 'none';
    currentReplyTo = null;
    // If there is history to go back to, trigger it
    if (window.history.length > 1) {
      history.back();
    } else {
      // If no history, just reset the UI
      resetToHome();
    }
  }

  // Listen for the Android Hardware Back Button
  window.addEventListener('popstate', function(event) {
    // Check if the full screen image viewer is open
    const imgViewer = document.getElementById('full-image-viewer');
    if (imgViewer && imgViewer.style.display === 'flex') {
        // Just hide the viewer, history already moved back
        imgViewer.style.display = 'none';
        return;
    }
    // Otherwise, reset the UI to home
    resetToHome();
  });

  
  function appendMessage(text, type, timeStr, status = '', isImage = false, isVoice = false, msgId = null, replyData = null, isWhisper = false, isVideo = false, bubbleColor = null) {
    console.log("APPEND #1 CALLED: isImage=" + isImage + ", text=" + text);
    console.log("LOCAL APPEND CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    if (window.enableAnimations !== false) newMsg.classList.add('zoom-in');
    if (bubbleColor && type === 'sent') { newMsg.style.setProperty('background', bubbleColor, 'important'); newMsg.style.setProperty('background-color', bubbleColor, 'important'); }
    
    const id = msgId || Date.now().toString();
    newMsg.id = 'msg-' + id;

    if (replyData) {
        const quote = document.createElement('div');
        quote.className = 'quoted-msg';
        quote.innerHTML = '<strong>' + replyData.name + '</strong>' + (replyData.text.startsWith('data:image') ? '📷 Photo' : (replyData.text.startsWith('data:audio') ? '🎤 Voice Note' : replyData.text));
        quote.style.cursor = 'pointer';
        quote.style.pointerEvents = 'auto'; // Force it to be clickable
        quote.onclick = function() { 
            if(replyData.msgId) {
                scrollToMessage(replyData.msgId); 
            } else {
                alert("Cannot find original message ID");
            }
        };
        newMsg.appendChild(quote);
    }
    
    // --- WHISPER MESSAGE LOGIC ---
    if (isWhisper) {
        newMsg.classList.add('whisper-msg');
        
        const label = document.createElement('div');
        label.className = 'whisper-label';
        label.innerText = '👻 Tap to reveal';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'whisper-content';
        
        // Add text to the blurred content
        const textNode = document.createTextNode(text);
        contentDiv.appendChild(textNode);
        
        newMsg.appendChild(contentDiv);
        newMsg.appendChild(label);
        
        newMsg.onclick = function() {
            if (!newMsg.classList.contains('revealed')) {
                newMsg.classList.add('revealed');
                label.innerText = 'Auto-destructing...';
                
                // Auto destruct after 5 seconds
                setTimeout(() => {
                    newMsg.style.transition = 'opacity 1s, transform 1s';
                    newMsg.style.opacity = '0';
                    newMsg.style.transform = 'scale(0.8)';
                    setTimeout(() => newMsg.remove(), 1000);
                }, 5000);
            }
        };
        
    } else if (isImage) {
      const img = document.createElement('img');
      img.style.cursor = 'pointer';
      
      if (text.startsWith('/media/') && text.endsWith('.mp4')) {
          // It's a VIDEO! Render as a playable player
          const video = document.createElement('video');
          video.src = text;
          video.controls = true;
          video.style.maxWidth = '250px'; video.style.width = 'auto';
          video.style.borderRadius = '10px';
          newMsg.appendChild(video);
          return; // Stop, don't append img
      } else if (text.startsWith('/media/')) {
          // It's an IMAGE URL from the server
          img.src = text;
          img.style.borderRadius = '10px';
          img.style.maxWidth = '100%';
      } else if (text.startsWith('img_ref_')) {
          // It's an IndexedDB image. Load it safely.
          const realId = text.replace('img_ref_', '');
          img.style.minHeight = '150px';
          img.style.backgroundColor = 'rgba(255,255,255,0.05)';
          img.style.borderRadius = '10px';
          
          getImgFromDB(realId, function(base64Data) {
              if(base64Data) {
                  img.src = base64Data;
                  img.style.minHeight = 'auto';
                  img.style.backgroundColor = 'transparent';
              }
          });
      } else {
          // Fallback for old normal images
          img.src = text; 
      }
      
      img.onclick = function(e) { 
          e.stopPropagation(); 
          if (img.src && img.src.startsWith('data:image')) {
              openFullscreenMedia(img.src); 
          }
      };
      
      newMsg.appendChild(img);
    } else if (isVoice || (text && text.startsWith('data:audio'))) {
      // Build Custom WhatsApp Player
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
      
      // Generate deterministic random bars based on string length
      const numBars = 25;
      const bars = [];
      for(let i=0; i<numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'wa-bar';
        // Random height between 20% and 100%
        const h = 20 + (Math.random() * 80); 
        bar.style.height = h + '%';
        waveDiv.appendChild(bar);
        bars.push(bar);
      }
      
      playerDiv.appendChild(playBtn);
      playerDiv.appendChild(waveDiv);
      playerDiv.appendChild(timeSpan);
      
      // Hidden real audio element
      const audio = document.createElement('audio');
      audio.src = text;
      audio.style.display = 'none';
      
      playerDiv.appendChild(audio);
      newMsg.appendChild(playerDiv);
      
      // --- Player Logic ---
      let isPlaying = false;
      playBtn.onclick = function() {
        if (isPlaying) {
          audio.pause();
          playBtn.innerText = '▶';
          isPlaying = false;
        } else {
          audio.play();
          playBtn.innerText = '⏸';
          playBtn.classList.add('played'); // Turn blue
          isPlaying = true;
          
          // Mark all bars as played
          bars.forEach(b => b.classList.add('played'));
        }
      };
      
      audio.onended = function() {
        playBtn.innerText = '▶';
        isPlaying = false;
        // Reset bars to start if replayed later (optional)
      };
      
      audio.ontimeupdate = function() {
        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60);
        timeSpan.innerText = mins + ':' + secs.toString().padStart(2, '0');
        
        // Calculate progress to color bars
        const progress = audio.currentTime / (audio.duration || 1);
        const playedBars = Math.floor(progress * numBars);
        bars.forEach((b, i) => {
          if (i < playedBars) b.classList.add('played');
          else if (audio.currentTime === 0) b.classList.remove('played');
        });
      };
    } else {
      // --- MATRIX DECRYPTION EFFECT (OPTIMIZED) ---
      if (type === 'received' && text.length > 0) {
        const textSpan = document.createElement('span');
        newMsg.appendChild(textSpan);
        
        const originalText = Array.from(text);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]<>';
        let iteration = 0;
        
        textSpan.style.color = 'var(--primary)';
        textSpan.style.fontFamily = 'monospace';
        
        const speed = 0.15; // Speed of decryption (higher is faster)
        const maxScramble = 15; // Max random characters at once for smoothness
        let lastTime = 0;
        
        function animateMatrix(time) {
          if (!lastTime) lastTime = time;
          const delta = time - lastTime;
          
          // Only update if enough time has passed (approx 30fps for the scramble)
          if (delta > 30) {
            let output = '';
            for (let i = 0; i < originalText.length; i++) {
              if (i < iteration) {
                output += originalText[i];
              } else if (originalText[i] === ' ') {
                output += ' ';
              } else if (i < iteration + maxScramble) {
                output += chars[Math.floor(Math.random() * chars.length)];
              } else {
                output += ' '; // Prevent massive CPU load by only scrambling near the cursor
              }
            }
            textSpan.innerText = output;
            iteration += speed;
            lastTime = time;
          }
          
          if (iteration < originalText.length) {
            requestAnimationFrame(animateMatrix);
          } else {
            textSpan.innerText = text;
            textSpan.style.color = '';
            textSpan.style.fontFamily = '';
          }
        }
        requestAnimationFrame(animateMatrix);
        
      } else {
        // Normal text for sent messages
        
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

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = status === 'pending' ? '🕒' : ((status === 'read' || status === 'delivered') ? '✓✓' : '✓');
      newMsg.appendChild(check);
    }
    
    // Insert before the spacer if it exists, otherwise just append
    // --- FLY ANIMATION FOR SENT MESSAGES ---
    if (type === 'sent') {
        newMsg.classList.add('materialize-in');
        setTimeout(() => newMsg.classList.remove('materialize-in'), 500); 
    }

    // --- WATER DROP SPLASH ANIMATION ---
    if (type === 'sent') {
        newMsg.classList.add('msg-water-pop');
        setTimeout(() => newMsg.classList.remove('msg-water-pop'), 550); 
    }

    const spacer = document.getElementById('chat-spacer');
    if (spacer) {
        msgBox.insertBefore(newMsg, spacer);
    } else {
        msgBox.appendChild(newMsg);
    }
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  function sendMessage() {
    console.log("GROUPS DB:", JSON.parse(localStorage.getItem('bapp_groups')));
    console.log("ACTIVE CHAT:", activeChatId);
    
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (text === "") return;
    // --- TRIVIA CHECK ---
    if (typeof window.checkTriviaAnswer === 'function' && window.checkTriviaAnswer(text)) {
      input.value = ''; 
      return; 
    }
    // --------------------

    const to = activeChatId;
    const reply = currentReplyTo;
    const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgId = Date.now().toString();
    
    const isConnected = socket.readyState === WebSocket.OPEN;
    const status = isConnected ? 'sent' : 'pending';

    // 1. Show on screen immediately
    appendMessage(text, 'sent', now, status, false, false, msgId, reply, false, false, myProfile.bubbleColor || '#005c4b');
      
      
    input.value = '';
    triggerInputDrop();
 
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
        savedMsgs.push({ text: text, type: 'sent', time: now, status: status, msgId: msgId, replyData: reply, bubbleColor: myProfile.bubbleColor || '#005c4b' });
        localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
        loadChatList();
    } catch(e) { console.error("Storage full"); }

    const rp = document.getElementById('reply-preview');
    if (rp) rp.style.display = 'none';
    currentReplyTo = null;
    if (window.replyState && activeChatId) delete window.replyState[activeChatId];

    // 3. Send now OR save to Offline Queue
    // --- CHECK IF IT'S A GROUP MESSAGE ---
      const isGroup = activeChatId.startsWith('group_');
      let groupMembers = [];
      if (isGroup) {
          let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
          if (groups[activeChatId]) groupMembers = groups[activeChatId].members;
      }

      console.log("GROUP DEBUG:", { activeChatId, isGroup, groupMembers });
      
      const payload = {
          type: 'send_message',
          to: to,
          from: myBappId,
          text: text,
          msgId: msgId,
          replyData: reply,
          bubbleColor: myProfile.bubbleColor || '#005c4b',
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
  }

  function handleEnter(e) { if (e.key === 'Enter') sendMessage(); }

  let pendingMediaBase64 = null;
  let pendingIsVideo = false;
let pendingFileName = null;

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    event.target.value = ''; 

    // Show modal
    document.getElementById('media-preview-modal').style.display = 'flex';
    document.getElementById('preview-loading').style.display = 'block';
    document.getElementById('preview-content').innerHTML = '';
    const sendBtn = document.getElementById('preview-send-btn');
    sendBtn.disabled = true;
    sendBtn.style.background = '#333';
    sendBtn.style.color = '#777';

    // --- FIX: CHECK FOR VIDEO FIRST TO PREVENT FREEZE ---
    if (file.type.startsWith('video/')) {
        pendingIsVideo = true;
        window.pendingVideoFile = file; // <--- STORE THE ACTUAL FILE FOR CHROME
        pendingMediaBase64 = URL.createObjectURL(file); // Instant preview, no RAM overload
        
        document.getElementById('preview-loading').style.display = 'none';
        document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
        
        sendBtn.disabled = false;
        sendBtn.style.background = '#25D366';
        sendBtn.style.color = 'black';
        return; // Stop here, skip the FileReader completely
    }
    // ----------------------------------------------------

    const reader = new FileReader();
    reader.onload = function(e) {
      if (file.type.startsWith('video/')) {
         pendingIsVideo = true;
         pendingMediaBase64 = e.target.result;
         
         document.getElementById('preview-loading').style.display = 'none';
         document.getElementById('preview-content').innerHTML = '<video src="' + pendingMediaBase64 + '" controls style="max-width:100%; max-height:70vh; border-radius:15px;"></video>';
         
         sendBtn.disabled = false;
         sendBtn.style.background = '#25D366';
         sendBtn.style.color = 'black';
      } else {
         pendingIsVideo = false;
         const img = new Image();
         img.onload = function() {
           const canvas = document.createElement('canvas');
           const MAX_WIDTH = 720; const MAX_HEIGHT = 720;
           let width = img.width; let height = img.height;
           if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
           else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
           canvas.width = width; canvas.height = height;
           const ctx = canvas.getContext('2d');
           ctx.drawImage(img, 0, 0, width, height);
           pendingMediaBase64 = canvas.toDataURL('image/jpeg', 0.6);
           
           document.getElementById('preview-loading').style.display = 'none';
           document.getElementById('preview-content').innerHTML = '<img src="' + pendingMediaBase64 + '" style="max-width:100%; max-height:70vh; border-radius:15px;">';
           
           sendBtn.disabled = false;
           sendBtn.style.background = '#25D366';
           sendBtn.style.color = 'black';
         };
         img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  async function confirmMediaSend() {
    if(!pendingMediaBase64) return;
    
    // Instantly close modal
    document.getElementById('media-preview-modal').style.display = 'none';
    if(typeof showToast === 'function') showToast("Uploading...");

    try {
        // 1. Upload the file to the server
        let blob;
        if (pendingIsVideo && window.pendingVideoFile) {
            blob = window.pendingVideoFile; // Use the real file object for videos
        } else {
            blob = await (await fetch(pendingMediaBase64)).blob();
        }
        
        const formData = new FormData();
        const isVid = pendingIsVideo;
        const filename = (isVid ? 'video_' : 'image_') + Date.now() + '.' + (pendingFileName ? pendingFileName.split('.').pop() : (isVid ? 'mp4' : 'jpg'));
        formData.append('image', blob, filename);

        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if(!data.url) throw new Error("Upload failed");

        // 2. Prepare the payload with Group info
        const to = activeChatId;
        const msgId = Date.now().toString();
        const reply = currentReplyTo;
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

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
            text: data.url,
            isImage: true,
            isVideo: isVid,
            msgId: msgId,
            replyData: reply,
            isGroup: isGroup,
            groupMembers: groupMembers
        };

        // 3. Send or Queue
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        } else {
            let queue = JSON.parse(localStorage.getItem('bapp_offline_queue')) || [];
            queue.push(payload);
            localStorage.setItem('bapp_offline_queue', JSON.stringify(queue));
        }

        // 4. Render locally
        appendMessage(data.url, 'sent', now, 'sent', true, false, msgId, reply, false, isVid);
        
        try {
            const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + to)) || [];
            savedMsgs.push({ text: data.url, type: 'sent', time: now, isImage: true, isVideo: isVid, status: 'sent', msgId: msgId });
            localStorage.setItem('bapp_msgs_' + to, JSON.stringify(savedMsgs));
            loadChatList();
        } catch(e) { console.error(e); }

        const rp = document.getElementById('reply-preview');
        if (rp) rp.style.display = 'none';
        currentReplyTo = null;
        if (window.replyState && activeChatId) delete window.replyState[activeChatId];
        
        pendingMediaBase64 = null;
        window.pendingVideoFile = null;
    } catch(err) {
        console.error("Upload error:", err);
        alert("Upload failed: " + err.message);
    }
}

  
  function openThemeModal() {
    document.getElementById('theme-modal').style.display = 'flex';
    document.getElementById('custom-theme-color').value = window.selectedBubbleColor;
    setThemeColor(window.selectedBubbleColor); // Trigger preview update
  }
  
  function closeThemeModal() {
    document.getElementById('theme-modal').style.display = 'none';
  }

  function setThemeColor(color) {
    window.selectedBubbleColor = color;
    document.getElementById('theme-preview-bubble').style.background = color;
    document.getElementById('custom-theme-color').value = color;
    
    // Highlight the selected swatch
    document.querySelectorAll('.color-swatch').forEach(s => {
        if (s.style.background.includes(color) || s.style.backgroundColor.includes(color)) {
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

  function openSettings() {
    history.pushState({ view: 'settings' }, '', '#settings');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('settings-view').classList.add('active');
    document.getElementById('settings-username').value = myBappId;
    document.getElementById('settings-name-input').value = myProfile.name;
    document.getElementById('settings-bio').value = myProfile.bio || '';
    document.getElementById('settings-phone').value = myProfile.phone || '';
    document.getElementById('settings-location').value = myProfile.location || 'Unknown';
    document.getElementById('settings-avatar').src = myProfile.avatar;
    window.selectedBubbleColor = myProfile.bubbleColor || '#005c4b';
    document.getElementById('settings-color-indicator').style.background = window.selectedBubbleColor;
    document.getElementById('settings-color-indicator').style.background = window.selectedBubbleColor;
    document.getElementById('settings-auto-location').checked = myProfile.autoLocation || false;
    document.getElementById('settings-animations').checked = window.enableAnimations !== false;
    document.getElementById('settings-panic-mode').checked = window.enablePanicMode !== false;
    document.getElementById('settings-shake-undo').checked = window.enableShakeToUndo === true;
    if (myProfile.autoLocation) startAutoLocation(); else stopAutoLocation();
  }

  const cities = ['Kampala, UG', 'Nairobi, KE', 'London, UK', 'New York, USA', 'Tokyo, JP', 'Dubai, UAE', 'Cape Town, ZA', 'Paris, FR'];
  function randomizeLocation() { document.getElementById('settings-location').value = cities[Math.floor(Math.random() * cities.length)]; }
  function startAutoLocation() { stopAutoLocation(); autoLocationInterval = setInterval(() => { randomizeLocation(); }, 30000); }
  function stopAutoLocation() { if (autoLocationInterval) clearInterval(autoLocationInterval); }
  document.getElementById('settings-auto-location').addEventListener('change', function(e) { if (e.target.checked) startAutoLocation(); else stopAutoLocation(); });

  function saveProfile() {
    myProfile.name = document.getElementById('settings-name-input').value || myBappId;
    myProfile.bio = document.getElementById('settings-bio').value;
    myProfile.phone = document.getElementById('settings-phone').value;
    myProfile.location = document.getElementById('settings-location').value;
    myProfile.autoLocation = document.getElementById('settings-auto-location').checked;
    window.enableAnimations = document.getElementById('settings-animations').checked;
    localStorage.setItem('bapp_animations', window.enableAnimations);
    if (window.enableAnimations) document.body.classList.remove('no-animations');
    else document.body.classList.add('no-animations');
    window.enablePanicMode = document.getElementById('settings-panic-mode').checked;
    window.enableShakeToUndo = document.getElementById('settings-shake-undo').checked;
    localStorage.setItem('bapp_panic_mode', window.enablePanicMode);
    localStorage.setItem('bapp_shake_undo', window.enableShakeToUndo);
    myProfile.bubbleColor = window.selectedBubbleColor || '#005c4b';
    try { localStorage.setItem('bapp_profile', JSON.stringify(myProfile)); } 
    catch(e) { alert("Storage is full!"); return; }
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    profiles[myBappId] = myProfile;
    localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
    socket.send(JSON.stringify({ type: 'register_user', username: myBappId, profile: myProfile }));
    const btn = document.querySelector('.save-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Saved! ✅'; btn.style.background = '#2ecc71';
    setTimeout(() => { btn.innerText = originalText; btn.style.background = 'var(--primary)'; goBack(); }, 1000);
  }

  document.getElementById('settings-pic-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 300; canvas.width = MAX_SIZE; canvas.height = MAX_SIZE;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      const xOffset = (img.width - size) / 2; const yOffset = (img.height - size) / 2;
      ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
      myProfile.avatar = compressedBase64;
      document.getElementById('settings-avatar').src = compressedBase64;
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = function() { alert("Could not load image."); URL.revokeObjectURL(objectUrl); };
    img.src = objectUrl;
  });

  function startCall(type) {
    const name = document.getElementById('chat-name').textContent;
    if(type === 'video') alert("📹 Starting Video Call with " + name + "...");
    else alert("📞 Starting Audio Call with " + name + "...");
  }

  
  function createGroupWith() {
    const targetUser = activeChatId;
    const groupName = prompt("Enter Group Name:", "Group with " + targetUser);
    if (!groupName) return;
    const groupId = "group_" + Date.now();
    const members = [myBappId, targetUser];
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'create_group', groupId, groupName, members, creator: myBappId }));
    saveChat(groupId);
    loadChatList();
    closeContactInfo();
    openChat(groupId);
  }

  function openContactInfo() {
    if (activeChatId && activeChatId.startsWith('group_')) { openGroupInfo(activeChatId); return; }
    history.pushState({ view: 'contact' }, '', '#contact');
    const currentUsername = activeChatId;
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let p = profiles[currentUsername] || { name: currentUsername, avatar: 'https://ui-avatars.com/api/?name=' + currentUsername.substring(0,2), bio: 'Hey there! I am using BAPP.', phone: 'Not shared', location: 'Unknown' };
    document.getElementById('info-name').textContent = p.name || currentUsername;
    document.getElementById('info-username').textContent = '@' + currentUsername;
    document.getElementById('info-avatar').src = p.avatar;
    document.getElementById('info-bio').textContent = p.bio || 'Hey there! I am using BAPP.';
    document.getElementById('info-phone').textContent = p.phone || 'Not shared';
    document.getElementById('info-location').textContent = p.location || 'Unknown';
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('contact-info-view').classList.add('active');
  }
  function closeContactInfo() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'search_result') {
        const dropdown = document.getElementById('search-dropdown');
        dropdown.innerHTML = '';
        if (data.matches.length === 0) {
          dropdown.innerHTML = '<div style="padding:15px; color:var(--text-muted); text-align:center;">No users found</div>';
        } else {
          data.matches.forEach(userObj => {
            const uName = userObj.username;
            const uProfile = userObj.profile;
            const avatarUrl = uProfile.avatar || 'https://ui-avatars.com/api/?name=' + uName.substring(0,2) + '&background=random';
            const displayName = uProfile.name || uName;
            const item = `<div style="display:flex; align-items:center; padding:12px 15px; border-bottom:1px solid var(--glass-border); cursor:pointer;" onclick='selectSearchUser(${JSON.stringify(userObj)})'>
                <img src="${avatarUrl}" style="width:35px; height:35px; border-radius:50%; margin-right:12px;">
                <div style="font-weight:500;">${displayName} <span style="color:var(--text-muted); font-size:12px;">@${uName}</span></div>
              </div>`;
            dropdown.insertAdjacentHTML('beforeend', item);
          });
        }
        dropdown.style.display = 'block';
      }

      
      if (data.type === 'recording') {
        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();
        
        // --- TRIGGER INCOMING POPUP ---
        let senderName = senderId;
        try {
          let p = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
          if (p[senderId] && p[senderId].name) senderName = p[senderId].name;
        } catch(e) {}
        
        let popupMsg = data.text || '📷 Media';
        if (typeof popupMsg === 'string' && popupMsg.startsWith('data:')) popupMsg = '📷 Media';
        if (typeof popupMsg === 'string' && popupMsg.startsWith('/media/')) popupMsg = '📷 Media';
        
        if (typeof showMessagePopup === 'function') {
          showMessagePopup(senderName, popupMsg, senderId);
        }
        // ------------------------------
        
        // 1. Update inside the chat
        if (activeChatId === senderId) {
          const sub = document.getElementById('chat-subtitle');
          if (data.isRecording) {
            sub.innerText = '🔴 recording audio...';
            sub.style.color = '#e74c3c';
            sub.style.fontWeight = 'bold';
          } else {
            sub.innerText = '🔒 End-to-End Encrypted';
            sub.style.color = 'var(--text-muted)';
            sub.style.fontWeight = 'normal';
          }
        }

        // 2. Update the Chat List preview
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isRecording) {
            previewEl.innerText = '🔴 recording audio...';
            previewEl.style.color = '#e74c3c';
            previewEl.style.fontWeight = 'bold';
          } else {
            // Revert to last message
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : (last.isVoice || (last.text && last.text.startsWith('data:audio')) ? '🎤 Voice Note' : last.text);
            }
            previewEl.innerText = lastMsgText;
            previewEl.style.color = 'var(--text-muted)';
            previewEl.style.fontWeight = 'normal';
          }
        }
      }

      if (data.type === 'typing') {
        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();
        const dotsHTML = 'typing <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';

        // 1. Update inside the active chat header
        if (activeChatId === senderId) {
          document.getElementById('chat-subtitle').innerHTML = data.isTyping ? dotsHTML : '🔒 End-to-End Encrypted';
        }

        // 2. Update the Chat List on the Home Screen
        const previewEl = document.getElementById('preview-' + senderId);
        if (previewEl) {
          if (data.isTyping) {
            previewEl.innerHTML = dotsHTML;
          } else {
            // Revert back to the last message when they stop typing
            const msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
            let lastMsgText = 'Tap to chat';
            if (msgs.length > 0) {
              const last = msgs[msgs.length - 1];
              lastMsgText = last.isImage ? '📷 Photo' : last.text;
            }
            previewEl.innerText = lastMsgText;
          }
        }
      }

      if (data.type === 'delivered_receipt') {
        // 1. Update Local Storage
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.to)) || [];
        msgs.forEach(m => { 
            if(m.type === 'sent' && m.status === 'sent') m.status = 'delivered'; 
        });
        localStorage.setItem('bapp_msgs_' + data.to, JSON.stringify(msgs));
        
        // 2. Update the UI if we are inside the chat
        if (activeChatId === data.to) {
          const checks = document.querySelectorAll('.msg.sent .msg-status');
          checks.forEach(c => { 
              // Only change single gray ticks to double gray ticks
              if(!c.classList.contains('read') && c.innerText === '✓') {
                  c.innerText = '✓✓'; 
              }
          });
        }
      }

      if (data.type === 'ghost_deleted') {
        // 1. Remove from screen
        const msgToDelete = document.getElementById('msg-' + data.msgId);
        if (msgToDelete) {
            msgToDelete.style.transition = 'opacity 0.2s';
            msgToDelete.style.opacity = '0';
            setTimeout(() => msgToDelete.remove(), 200);
        }
        
        // 2. Remove from local memory
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
        msgs = msgs.filter(m => m.msgId !== data.msgId);
        localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(msgs));
        
        loadChatList(); // Update preview text
      }

      if (data.type === 'read_receipt') {
        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + data.from)) || [];
        msgs.forEach(m => { if(m.type === 'sent') m.status = 'read'; });
        localStorage.setItem('bapp_msgs_' + data.from, JSON.stringify(msgs));
        if (activeChatId === data.from) {
          const checks = document.querySelectorAll('.msg.sent .msg-status');
          checks.forEach(c => { c.innerText = '✓✓'; c.classList.add('read'); });
        }
      }

      if (data.type === 'offline_messages') {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        (async () => {
            for (const msg of data.messages) {
                try {
                    const senderId = (msg.isGroup && msg.groupId) ? msg.groupId : (msg.from || '').trim();
                    
                    if (msg.isGroupEvent) {
                        let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
                        groups[msg.groupId] = { name: msg.groupName, members: msg.members };
                        localStorage.setItem('bapp_groups', JSON.stringify(groups));
                        
                        let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msg.groupId)) || [];
                        msgs.push({ text: msg.text, type: 'received', time: now, msgId: msg.msgId });
                        localStorage.setItem('bapp_msgs_' + msg.groupId, JSON.stringify(msgs));
                        saveChat(msg.groupId);
                    } 
                    else {
                        let saveText = msg.text;
                        
                        // --- CRITICAL FIX: AWAIT THE DATABASE SAVE ---
                        if (msg.isImage && !msg.isVideo && msg.msgId) {
                            // If it's a /media/ URL, use it directly
                            if (msg.text.startsWith('/media/') || msg.text.startsWith('http')) {
                                console.log("✅ Offline Image URL used:", msg.text);
                                saveText = msg.text;
                            } else {
                                if (typeof saveImgToDB === 'function') {
                                    await saveImgToDB(msg.msgId, msg.text);
                                }
                                saveText = "img_ref_" + msg.msgId;
                            }
                        }
                        
                        const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
                        if (msg.msgId && savedMsgs.some(m => m.msgId === msg.msgId)) continue;
                        
                        savedMsgs.push({
                            text: saveText, type: 'received', time: now, isImage: msg.isImage, isVoice: msg.isVoice,
                            msgId: msg.msgId, replyData: msg.replyData, isWhisper: msg.isWhisper, isVideo: msg.isVideo, bubbleColor: msg.bubbleColor
                        });
                        
                        try {
                            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                        } catch (storageErr) {
                            for (let i = 0; i < localStorage.length; i++) {
                                let key = localStorage.key(i);
                                if (key.startsWith('bapp_msgs_')) {
                                    let msgs = JSON.parse(localStorage.getItem(key)) || [];
                                    msgs.forEach(m => { if (m.isImage && m.text && m.text.startsWith('data:image')) { m.text = "📷 [Image removed]"; m.isImage = false; } });
                                    localStorage.setItem(key, JSON.stringify(msgs));
                                }
                            }
                            localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
                        }
                        
                        saveChat(senderId);
                        if (activeChatId === senderId) {
                            appendMessage(saveText, 'received', now, '', msg.isImage, msg.isVoice, msg.msgId, msg.replyData, msg.isWhisper, msg.isVideo, msg.bubbleColor);
                        } else {
                            let unreads = getUnreads();
                            unreads[senderId] = (unreads[senderId] || 0) + 1;
                            localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
                        }
                    }
                } catch(e) { console.error("Skipped broken message", e); }
            }
            
            loadChatList();
            
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'sync_ack', username: myBappId }));
                    console.log("✅ Sync ACK sent.");
                }
            }, 1000);
        })();
      }
      
      // --- ONLINE STATUS ---
      if (data.type === 'online_users') {
        window.onlineUsers = data.users || [];
        // Update the rings on the current chat list
        document.querySelectorAll('.avatar-wrapper').forEach(wrapper => {
          const id = wrapper.getAttribute('data-user-id');
          const ring = wrapper.querySelector('.online-ring');
          if (ring) {
            ring.style.display = window.onlineUsers.includes(id) ? 'block' : 'none';
          }
        });
      }

      if (data.type === 'auth_success') {
            localStorage.setItem('bapp_username', data.username);
            if (data.profile) localStorage.setItem('bapp_profile', JSON.stringify(data.profile));
            
            return;
        } else if (data.type === 'auth_error') {
            alert(data.message);
            localStorage.removeItem('bapp_username');
            localStorage.removeItem('bapp_password');
            window.location.reload();
            return;
        }

        if (data.type === 'new_message') {

        // --- TRIGGER POPUP ---
        let popupName = data.from || data.groupId;
        try {
          let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
          if (profiles[popupName] && profiles[popupName].name) popupName = profiles[popupName].name;
        } catch(e) {}
        
        let popupText = data.text || '📷 Media';
        if (typeof popupText === 'string' && (popupText.startsWith('data:') || popupText.startsWith('/media/'))) popupText = '📷 Media';
        
        if (typeof showMessagePopup === 'function') {
          showMessagePopup(popupName, popupText, data.from || data.groupId);
        }
        // ----------------------

        
        // --- TRIVIA INVITE INTERCEPTOR ---
        if (data.text === "🏆 I invited you to play Trivia!") {
            const game = document.getElementById('trivia-game');
            if (game) {
                game.style.display = 'flex';
                document.getElementById('trivia-status').innerText = 'Opponent wants to play! Are you ready?';
                document.getElementById('trivia-question').style.display = 'none';
                document.getElementById('trivia-input-area').style.display = 'none';
                
                const readyBtn = document.getElementById('trivia-ready-btn');
                if(readyBtn) {
                  readyBtn.style.display = 'block';
                  
                }
                const oldStartBtn = document.getElementById('trivia-start-btn');
                if(oldStartBtn) oldStartBtn.style.display = 'none';

                isPlayer1 = false;
            }
        }
        // ---------------------------------

        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const senderId = (data.isGroup && data.groupId) ? data.groupId : (data.from || '').trim();
        
        if (data.senderProfile) {
            let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
            profiles[senderId] = data.senderProfile;
            localStorage.setItem('bapp_profiles', JSON.stringify(profiles));
        }
        
        let saveText = data.isVideo ? data.text.split("?")[0] + "?v=" + Date.now() : data.text;
        if (data.isImage && !data.isVideo) {
            // If it's a URL from the server, use it directly!
            if (data.text.startsWith('/media/') || data.text.startsWith('http')) {
                saveText = data.text;
            } else {
                saveImgToDB(data.msgId, data.text);
                saveText = "img_ref_" + data.msgId;
            }
        }

        try {
          const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
          savedMsgs.push({ text: saveText, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, isVideo: data.isVideo, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
          localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
        } catch(e) {
          console.warn("Receiver storage full! Clearing old images...");
          for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              if (key.startsWith('bapp_msgs_')) {
                  let msgs = JSON.parse(localStorage.getItem(key)) || [];
                  let changed = false;
                  msgs.forEach(m => {
                      if (m.isImage && m.text && m.text.startsWith('data:image')) {
                          m.text = "📷 [Image removed to save space]";
                          m.isImage = false;
                          changed = true;
                      }
                  });
                  if (changed) localStorage.setItem(key, JSON.stringify(msgs));
              }
          }
          // Retry saving the new message
          try {
              const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + senderId)) || [];
              savedMsgs.push({ text: data.text, type: 'received', time: now, isImage: data.isImage, isVoice: data.isVoice, msgId: data.msgId, replyData: data.replyData, isWhisper: data.isWhisper, bubbleColor: data.bubbleColor });
              localStorage.setItem('bapp_msgs_' + senderId, JSON.stringify(savedMsgs));
          } catch(e2) { console.error("Still full after cleanup."); }
        }
        
        saveChat(senderId);
        
        if (activeChatId === senderId) {
          appendMessage(data.text, 'received', now, '', data.isImage, data.isVoice, data.msgId, data.replyData, data.isWhisper, data.isVideo, data.bubbleColor);
          safeSendReceipt(senderId);
        } else {
          let unreads = getUnreads();
          unreads[senderId] = (unreads[senderId] || 0) + 1;
          localStorage.setItem('bapp_unreads', JSON.stringify(unreads));
        }
        loadChatList();
      }
    } catch(err) { console.error("Socket Error:", err); }
  };

  
  let currentViewImageSrc = "";
  
  function openImageFullscreen(src) {
    currentViewImageSrc = src;
    document.getElementById('fullscreen-img').src = src;
    document.getElementById('img-viewer').style.display = 'flex';
  }

  function closeImageFullscreen() {
    document.getElementById('img-viewer').style.display = 'none';
  }

  function saveImage() {
    const a = document.createElement('a');
    a.href = currentViewImageSrc;
    a.download = 'BAPP_Image_' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert("Image download started! (If it didn't save, long-press the image and select 'Save Image').");
  }

  function forwardImage() {
    const targetUser = prompt("Enter the BAPP username to forward this photo to:");
    if(targetUser && targetUser.trim() !== "") {
      const cleanTarget = targetUser.trim().toLowerCase();
      
      // Send via WebSocket
      socket.send(JSON.stringify({ type: 'send_message', to: cleanTarget, from: myBappId, text: currentViewImageSrc, isImage: true }));
      
      // Save to local storage so it shows in our own forwarded chat
      const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const savedMsgs = JSON.parse(localStorage.getItem('bapp_msgs_' + cleanTarget)) || [];
      savedMsgs.push({ text: currentViewImageSrc, type: 'sent', time: now, isImage: true, status: 'sent' });
      localStorage.setItem('bapp_msgs_' + cleanTarget, JSON.stringify(savedMsgs));
      
      saveChat(cleanTarget);
      loadChatList();
      alert("Photo forwarded to @" + cleanTarget);
      closeImageFullscreen();
    }
  }

  // Live typing logic

  let typingTimeout = null;
  document.getElementById('chat-input').addEventListener('input', function() {
    const to = activeChatId;
    if (!to || socket.readyState !== WebSocket.OPEN) return;
    if (!window.ghostMode) socket.send(JSON.stringify({ type: "typing", to: to, from: myBappId, isTyping: true }));
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: 'typing', to: to, from: myBappId, isTyping: false }));
    }, 2000);
  });


  
  // Background is now a spinning CSS sphere.


