
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update();
      if (reg.waiting) reg.waiting.postMessage({type: 'SKIP_WAITING'});
    }).then(function(registration) {
        console.log('ServiceWorker registered with scope: ', registration.scope);
        
        // If there is an update, reload the page automatically
        registration.onupdatefound = function() {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = function() {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New update found! Reloading to apply...');
                window.location.reload();
              }
            }
          };
        };
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }

  
  // --- BREATHING BACKGROUND (Canvas) ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let dots = [];
  const SPACING = 25; // Matched from your CSS
  const RADIUS = 8;   // Matched from your CSS gradient size

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDots();
  }

  function initDots() {
    dots = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDist = 300; // Matched your 600px width (radius 300)

    for (let x = 0; x < canvas.width; x += SPACING) {
      for (let y = 0; y < canvas.height; y += SPACING) {
        const dist = Math.hypot(x - centerX, y - centerY);
        
        if (dist < maxDist) {
            // Smooth fade at the edges (like your mask-image)
            let maskAlpha = 1 - (dist / maxDist);
            maskAlpha = Math.pow(maskAlpha, 1.2);

            if (maskAlpha > 0.05) {
                // Base alpha matched your CSS (0.04) but slightly boosted for canvas
                let baseAlpha = 0.08 * maskAlpha; 
                
                // Check if light mode
                const isLight = document.body.classList.contains('light-mode');
                
                dots.push({
                  x: x,
                  y: y,
                  baseAlpha: baseAlpha,
                  currentAlpha: baseAlpha,
                  state: 'idle',
                  speed: 0,
                  waitTime: 0,
                  color: isLight ? '0,0,0' : '255,255,255'
                });
            }
        }
      }
    }
  }

  function animateBackground() {
    requestAnimationFrame(animateBackground);
      if (window.pauseBgAnimation) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Randomly pick a dot to start fading out
    if (Math.random() > 0.90) { // Controls how often dots blink
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      if (randomDot && randomDot.state === 'idle') {
        randomDot.state = 'fadingOut';
        randomDot.speed = Math.random() * 0.01 + 0.005; // Random fade speed
      }
    }

    // Update and draw dots
    dots.forEach(dot => {
      if (dot.state === 'fadingOut') {
        dot.currentAlpha -= dot.speed;
        if (dot.currentAlpha <= 0) {
          dot.currentAlpha = 0;
          dot.state = 'waitingToFadeIn';
          dot.waitTime = Date.now() + (Math.random() * 3000 + 500); // Wait 0.5 to 3.5 sec
        }
      } else if (dot.state === 'waitingToFadeIn') {
        if (Date.now() > dot.waitTime) {
          dot.state = 'fadingIn';
        }
      } else if (dot.state === 'fadingIn') {
        dot.currentAlpha += dot.speed;
        if (dot.currentAlpha >= dot.baseAlpha) {
          dot.currentAlpha = dot.baseAlpha;
          dot.state = 'idle';
        }
      }

      // Draw the ring (hollow circle)
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${dot.color}, ${dot.currentAlpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  // Initialize and start
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateBackground();

  // Re-initialize if theme changes
  function toggleTheme() { 
    document.body.classList.toggle('light-mode'); 
    initDots(); // Re-run to change colors
  }

  // --- BAPP AI LOGIC ---
  let isListening = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
      isListening = true;
      document.getElementById('bapp-ai-orb').classList.add('listening');
      document.getElementById('bapp-ai-orb').innerText = '🎤';
    };

    recognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      console.log('BAPP AI Heard:', speechResult);
      processBappCommand(speechResult);
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error', event.error);
      stopBappAI();
      speakBappAI("Sorry, I didn't catch that.");
    };

    recognition.onend = function() {
      stopBappAI();
    };

    window.startBappAI = function() {
      if (isListening) return;
      try {
        recognition.start();
      } catch(e) {
        console.log("Recognition already started");
      }
    };

    function stopBappAI() {
      isListening = false;
      const orb = document.getElementById('bapp-ai-orb');
      orb.classList.remove('listening');
      orb.innerText = '🤖';
    }

    // --- BAPP AI BRAIN ---
    function processBappCommand(command) {
      // Pattern 1: Send Message (e.g., "message kevin I am coming")
      const messageMatch = command.match(/(?:message|text|tell)\s+([a-z0-9_]+)\s+(.*)/i);
      // Pattern 2: Call (e.g., "call kevin")
      const callMatch = command.match(/(?:call|phone)\s+([a-z0-9_]+)/i);

      if (messageMatch) {
        const targetName = messageMatch[1].trim();
        const msgText = messageMatch[2].trim();
        executeBappAction(targetName, 'message', msgText);
      } 
      else if (callMatch) {
        const targetName = callMatch[1].trim();
        executeBappAction(targetName, 'call');
      } 
      else {
        speakBappAI("I didn't understand. Try saying 'Message Alex hello' or 'Call Alex'.");
      }
    }

    function executeBappAction(targetName, actionType, messageText) {
      // Find the user in saved chats or profiles
      const profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
      let foundUserId = null;
      let foundDisplayName = null;

      // Search through profiles
      for (let id in profiles) {
        if (id.toLowerCase() === targetName || (profiles[id].name && profiles[id].name.toLowerCase().includes(targetName))) {
          foundUserId = id;
          foundDisplayName = profiles[id].name || id;
          break;
        }
      }

      if (!foundUserId) {
        // Fallback: Check local chats
        const chats = JSON.parse(localStorage.getItem('bapp_chats')) || [];
        for (let id of chats) {
          if (id.toLowerCase() === targetName) {
            foundUserId = id;
            foundDisplayName = id;
            break;
          }
        }
      }

      if (!foundUserId) {
        speakBappAI("I couldn't find " + targetName + " in your contacts.");
        return;
      }

      // Execute the action
      if (actionType === 'message') {
        speakBappAI("Sending message to " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            input.value = messageText;
            
            // TRIGGER THE INPUT EVENT so the UI knows text was added
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Wait a tiny bit for the UI to catch up, then send
            setTimeout(() => {
                sendMessage();
            }, 150);
        }, 500); // Wait for chat to open
      } 
      else if (actionType === 'call') {
        speakBappAI("Calling " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            startCall('audio');
        }, 800);
      }
    }

    // --- BAPP AI MOUTH ---
    function speakBappAI(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    }

  } else {
    // If browser doesn't support
    window.startBappAI = function() { alert("Your browser does not support Speech Recognition."); };
  }

  // --- PANIC MODE (FAKE CALCULATOR) ---
  let calcStr = "";
  let lastShake = 0;

  // Shake detection
  
  window.addEventListener('devicemotion', function(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const force = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
    const now = Date.now();
    
    if (force > 35 && (now - lastShake) > 2000) {
      lastShake = now;
      
      // Check Panic Mode
      if (window.enablePanicMode) {
          document.getElementById('fake-calculator').style.display = 'flex';
      } 
      // Check Shake to Undo
      else if (window.enableShakeToUndo) {
          if (window.lastSentMessage && window.lastSentMessage.msgId) {
              const msgToDelete = window.lastSentMessage;
              
              // 1. Remove from DOM
              const el = document.getElementById('msg-' + msgToDelete.msgId);
              if(el) {
                  el.style.transition = 'opacity 0.3s, transform 0.3s';
                  el.style.opacity = '0';
                  el.style.transform = 'scale(0.5)';
                  setTimeout(() => el.remove(), 300);
              }
              
              // 2. Remove from LocalStorage
              let msgs = JSON.parse(localStorage.getItem('bapp_msgs_' + msgToDelete.to)) || [];
              msgs = msgs.filter(m => m.msgId !== msgToDelete.msgId);
              localStorage.setItem('bapp_msgs_' + msgToDelete.to, JSON.stringify(msgs));
              loadChatList();

              // 3. Send Ghost Delete to Server
              if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ type: 'ghost_delete', to: msgToDelete.to, from: myBappId, msgId: msgToDelete.msgId }));
              }
              
              // 4. Clear the tracker
              window.lastSentMessage = null;
              
              // 5. Feedback
              if (typeof showToast === 'function') showToast("Message Undone! 🫢");
              else alert("Message Undone!");
          }
      }
    }
  });


  // Calculator Logic
  function updateCalcDisplay() {
    document.getElementById('calc-display').innerText = calcStr || "0";
  }

  function calcClear() {
    calcStr = "";
    updateCalcDisplay();
  }

  function calcInput(char) {
    // Prevent multiple operators in a row for realism
    if (['+', '-', '×', '÷'].includes(char)) {
      if (calcStr === "" || ['+', '-', '×', '÷'].includes(calcStr.slice(-1))) return;
    }
    calcStr += char;
    updateCalcDisplay();
  }

  function calcEquals() {
    // SECRET EXIT CODE
    if (calcStr === "1234") {
      document.getElementById('fake-calculator').style.display = 'none';
      calcStr = "";
      updateCalcDisplay();
      return;
    }

    // Real math
    try {
      let mathStr = calcStr.replace(/×/g, '*').replace(/÷/g, '/');
      let result = eval(mathStr);
      calcStr = String(result);
      updateCalcDisplay();
    } catch(e) {
      calcStr = "Error";
      updateCalcDisplay();
      setTimeout(calcClear, 1500);
    }
  }

  function calcNegate() {
    if (calcStr && !isNaN(calcStr)) {
      calcStr = String(parseFloat(calcStr) * -1);
      updateCalcDisplay();
    }
  }

  function calcPercent() {
    if (calcStr && !isNaN(calcStr)) {
      calcStr = String(parseFloat(calcStr) / 100);
      updateCalcDisplay();
    }
  }

  function openFullscreenMedia(src) {
    document.getElementById('full-image-src').src = src;
    document.getElementById('full-image-viewer').style.display = 'flex';
    // Push state so hardware back works correctly
    history.pushState({ view: 'image' }, '', '#image');
  }
  
  function closeFullscreenMedia() {
    document.getElementById('full-image-viewer').style.display = 'none';
    // Use replaceState so it doesn't trigger the popstate event!
    if (window.location.hash === '#image') {
        history.replaceState({ view: 'chat' }, '', '#chat');
    }
  }

  function triggerInputDrop() {
      const inputArea = document.querySelector('.chat-input-area');
      if (inputArea) {
          inputArea.classList.add('input-drop-anim');
          setTimeout(() => inputArea.classList.remove('input-drop-anim'), 400);
      }
  }

  // --- GLASS MENU LOGIC ---
  function openGlassMenu(title, options, settingKey) {
      document.getElementById('glass-options-title').innerText = title;
      const list = document.getElementById('glass-options-list');
      list.innerHTML = '';
      
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let currentSetting = settings[activeChatId] ? settings[activeChatId][settingKey] : null;
      
      options.forEach(opt => {
          let isSelected = (currentSetting === opt) || (opt.includes('encrypted') && settingKey === 'dummy');
          
          if (settingKey === 'dummy') {
              list.innerHTML += '<div style="color:var(--text-muted); font-size:14px; line-height:1.5;">' + opt + '</div>';
          } else {
              list.innerHTML += `
                  <div onclick="selectGlassOption('${settingKey}', '${opt}')" style="background:${isSelected ? 'var(--primary)' : 'var(--search-bg)'}; color:${isSelected ? 'black' : 'white'}; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between;">
                      <span>${opt}</span>
                      ${isSelected ? '<span>✓</span>' : ''}
                  </div>
              `;
          }
      });
      document.getElementById('glass-options-modal').style.display = 'flex';
  }

  function selectGlassOption(key, value) {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId][key] = value;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      
      document.getElementById('glass-options-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Updated to " + value);
      
      if (key === 'notifications') document.getElementById('grp-notif-val').innerText = value;
      if (key === 'disappearing') document.getElementById('grp-disappear-val').innerText = value;
  }

  // --- ADVANCED PRIVACY LOGIC ---
  function openPrivacyModal() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let p = settings[activeChatId] || {};
      
      document.getElementById('privacy-blur').checked = p.blurOnSwitch || false;
      document.getElementById('privacy-anticopy').checked = p.antiCopy || false;
      document.getElementById('privacy-previews').checked = p.hidePreviews || false;
      
      document.getElementById('privacy-modal').style.display = 'flex';
  }

  function saveAdvancedPrivacy() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      
      settings[activeChatId].blurOnSwitch = document.getElementById('privacy-blur').checked;
      settings[activeChatId].antiCopy = document.getElementById('privacy-anticopy').checked;
      settings[activeChatId].hidePreviews = document.getElementById('privacy-previews').checked;
      
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('privacy-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Privacy Settings Saved! 🛡️");
  }

  // --- BLUR ON APP SWITCH ---
  window.addEventListener('blur', function() {
      if (!activeChatId) return;
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if (settings[activeChatId] && settings[activeChatId].blurOnSwitch) {
          const msgBox = document.getElementById('chat-messages');
          if(msgBox) msgBox.style.filter = 'blur(15px)';
      }
  });
  window.addEventListener('focus', function() {
      const msgBox = document.getElementById('chat-messages');
      if(msgBox) msgBox.style.filter = 'none';
  });

  // --- CLEAR CHAT & EXIT GROUP ---
  function clearGroupChat() {
      if (confirm("Clear all messages in this chat? This cannot be undone.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          document.getElementById('chat-messages').innerHTML = '';
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat cleared!");
          else alert("Chat cleared.");
      }
  }
  
  function exitCurrentGroup() {
      if(!confirm("Are you sure you want to exit this group?")) return;
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let g = groups[activeChatId];
      if(g) {
          g.members = g.members.filter(m => m !== myBappId);
          localStorage.setItem('bapp_groups', JSON.stringify(groups));
      }
      let chats = getChats();
      chats = chats.filter(id => id !== activeChatId);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
      loadChatList();
      goBack();
  }

  // --- ANTI-COPY IN OPEN CHAT ---
  // We wrap the openChat function to add anti-copy
  const originalOpenChatForPrivacy = window.openChat;
  window.openChat = function(id, profileObj) {
      originalOpenChatForPrivacy(id, profileObj);
      
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      const chatBox = document.getElementById('chat-messages');
      if (chatBox) {
          if (settings[id] && settings[id].antiCopy) {
              chatBox.style.userSelect = 'none';
              chatBox.style.webkitUserSelect = 'none';
          } else {
              chatBox.style.userSelect = 'text';
              chatBox.style.webkitUserSelect = 'text';
          }
      }
  };

  // --- MASTER GROUP & PRIVACY LOGIC ---
  function openGroupInfo(groupId) {
    history.pushState({ view: 'group_info' }, '', '#group_info');
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[groupId];
    if(!g) return;
    document.getElementById('group-info-name').textContent = g.name;
    document.getElementById('group-info-count').textContent = g.members.length + " members";
    const list = document.getElementById('group-members-list');
    list.innerHTML = '';
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    g.members.forEach(member => {
        let p = profiles[member] || { name: member, avatar: 'https://ui-avatars.com/api/?name=' + member.substring(0,2) + '&background=random' };
        list.innerHTML += `<div style="display:flex; align-items:center; gap:10px; background:var(--search-bg); padding:10px; border-radius:12px;"><img src="${p.avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"><div style="font-size:16px; font-weight:500;">${p.name || member} ${member === myBappId ? '(You)' : ''}</div></div>`;
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('group-info-view').classList.add('active');
  }

  function closeGroupInfo() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('chat-view').classList.add('active');
  }

  function openAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
    document.getElementById('add-member-search').value = '';
    document.getElementById('add-member-results').innerHTML = '';
    setTimeout(() => document.getElementById('add-member-search').focus(), 100);
  }
  function closeAddMemberModal() { document.getElementById('add-member-modal').style.display = 'none'; }

  function searchUsersToAdd() {
    const query = document.getElementById('add-member-search').value.trim().toLowerCase();
    const resultsBox = document.getElementById('add-member-results');
    resultsBox.innerHTML = '';
    if (query.length === 0) return;
    let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let currentMembers = groups[activeChatId] ? groups[activeChatId].members : [];
    let matches = Object.keys(profiles).filter(user => (user.toLowerCase().includes(query) || (profiles[user].name && profiles[user].name.toLowerCase().includes(query))));
    if (matches.length === 0) { resultsBox.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:20px;">No users found</div>'; return; }
    matches.forEach(user => {
        let p = profiles[user];
        let isAlreadyIn = currentMembers.includes(user);
        let avatarUrl = p.avatar || 'https://ui-avatars.com/api/?name=' + user.substring(0,2) + '&background=random';
        resultsBox.innerHTML += `<div style="display:flex; align-items:center; gap:15px; padding:15px; background:rgba(255,255,255,0.05); border-radius:15px; margin-bottom:10px; cursor:${isAlreadyIn ? 'not-allowed' : 'pointer'}; opacity:${isAlreadyIn ? '0.5' : '1'};" onclick="addUserToGroup('${user}')"><img src="${avatarUrl}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;"><div><div style="font-size:16px; font-weight:bold; color:var(--text);">${p.name || user}</div><div style="font-size:12px; color:var(--text-muted);">@${user}</div></div><div style="margin-left:auto; font-size:20px; color:var(--primary);">${isAlreadyIn ? '✓' : '+'}</div></div>`;
    });
  }

  function addUserToGroup(username) {
    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    let g = groups[activeChatId];
    if (!g || g.members.includes(username)) return;
    g.members.push(username);
    localStorage.setItem('bapp_groups', JSON.stringify(groups));
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'add_group_member', groupId: activeChatId, newMember: username }));
    if (typeof showToast === 'function') showToast(username + " added!");
    closeAddMemberModal();
    openGroupInfo(activeChatId);
  }

  function openGlassMenu(title, options, settingKey) {
      document.getElementById('glass-options-title').innerText = title;
      const list = document.getElementById('glass-options-list');
      list.innerHTML = '';
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let currentSetting = settings[activeChatId] ? settings[activeChatId][settingKey] : null;
      options.forEach(opt => {
          let isSelected = (currentSetting === opt) || (opt.includes('encrypted') && settingKey === 'dummy');
          if (settingKey === 'dummy') {
              list.innerHTML += '<div style="color:var(--text-muted); font-size:14px; line-height:1.5;">' + opt + '</div>';
          } else {
              list.innerHTML += `<div onclick="selectGlassOption('${settingKey}', '${opt}')" style="background:${isSelected ? 'var(--primary)' : 'var(--search-bg)'}; color:${isSelected ? 'black' : 'white'}; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; display:flex; justify-content:space-between;"><span>${opt}</span>${isSelected ? '<span>✓</span>' : ''}</div>`;
          }
      });
      document.getElementById('glass-options-modal').style.display = 'flex';
  }

  function selectGlassOption(key, value) {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId][key] = value;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('glass-options-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Updated to " + value);
      if (key === 'notifications') document.getElementById('grp-notif-val').innerText = value;
      if (key === 'disappearing') document.getElementById('grp-disappear-val').innerText = value;
  }

  function openPrivacyModal() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      let p = settings[activeChatId] || {};
      document.getElementById('privacy-blur').checked = p.blurOnSwitch || false;
      document.getElementById('privacy-anticopy').checked = p.antiCopy || false;
      document.getElementById('privacy-previews').checked = p.hidePreviews || false;
      document.getElementById('privacy-modal').style.display = 'flex';
  }

  function saveAdvancedPrivacy() {
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if(!settings[activeChatId]) settings[activeChatId] = {};
      settings[activeChatId].blurOnSwitch = document.getElementById('privacy-blur').checked;
      settings[activeChatId].antiCopy = document.getElementById('privacy-anticopy').checked;
      settings[activeChatId].hidePreviews = document.getElementById('privacy-previews').checked;
      localStorage.setItem('bapp_chat_settings', JSON.stringify(settings));
      document.getElementById('privacy-modal').style.display = 'none';
      if(typeof showToast === 'function') showToast("Privacy Settings Saved! 🛡️");
  }

  function clearGroupChat() {
      if (confirm("Clear all messages in this chat? This cannot be undone.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          document.getElementById('chat-messages').innerHTML = '';
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat cleared!"); else alert("Chat cleared.");
      }
  }
  
  function exitCurrentGroup() {
      if(!confirm("Are you sure you want to exit this group?")) return;
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let g = groups[activeChatId];
      if(g) { g.members = g.members.filter(m => m !== myBappId); localStorage.setItem('bapp_groups', JSON.stringify(groups)); }
      let chats = getChats(); chats = chats.filter(id => id !== activeChatId);
      localStorage.setItem('bapp_chats', JSON.stringify(chats));
      loadChatList(); goBack();
  }

  // Blur logic
  window.addEventListener('blur', function() {
      if (!activeChatId) return;
      let settings = JSON.parse(localStorage.getItem('bapp_chat_settings')) || {};
      if (settings[activeChatId] && settings[activeChatId].blurOnSwitch) {
          const msgBox = document.getElementById('chat-messages');
          if(msgBox) msgBox.style.filter = 'blur(15px)';
      }
  });
  window.addEventListener('focus', function() {
      const msgBox = document.getElementById('chat-messages');
      if(msgBox) msgBox.style.filter = 'none';
  });

  function createGroupWith() {
    const targetUser = activeChatId;
    const groupName = prompt("Enter Group Name:", "Group with " + targetUser);
    if (!groupName) return;

    const groupId = "group_" + Date.now();
    const members = [myBappId, targetUser];

    let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
    groups[groupId] = { name: groupName, members: members };
    localStorage.setItem('bapp_groups', JSON.stringify(groups));

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'create_group', groupId, groupName, members, creator: myBappId }));
    }

    saveChat(groupId);
    loadChatList();
    closeContactInfo();
    openChat(groupId);
  }

  // --- LONG PRESS LOGIC FOR CHAT LIST ---
  let chatHoldTimer;
  let currentSelectedChatId = null;

  function startChatHold(event, id) {
      currentSelectedChatId = id;
      chatHoldTimer = setTimeout(() => {
          if(navigator.vibrate) navigator.vibrate(50);
          openChatListMenu(id);
      }, 600); // 600ms hold
  }

  function cancelChatHold() {
      clearTimeout(chatHoldTimer);
  }

  function openChatListMenu(id) {
      currentSelectedChatId = id;
      let profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
      let groups = JSON.parse(localStorage.getItem('bapp_groups')) || {};
      let name = id.startsWith('group_') ? (groups[id] ? groups[id].name : id) : (profiles[id] ? (profiles[id].name || id) : id);
      
      document.getElementById('chat-list-menu-title').innerText = "Chat Options: " + name;
      document.getElementById('chat-list-menu').style.display = 'flex';
  }

  function closeChatListMenu() {
      document.getElementById('chat-list-menu').style.display = 'none';
      currentSelectedChatId = null;
  }

  function deleteChatFromList() {
      if (!currentSelectedChatId) return;
      if (confirm("Delete this chat? This will remove it from your list.")) {
          localStorage.removeItem('bapp_msgs_' + currentSelectedChatId);
          let chats = getChats();
          chats = chats.filter(id => id !== currentSelectedChatId);
          localStorage.setItem('bapp_chats', JSON.stringify(chats));
          closeChatListMenu();
          loadChatList();
          if(typeof showToast === 'function') showToast("Chat deleted!");
      }
  }

  function blockUserFromList() {
      if (!currentSelectedChatId) return;
      if (confirm("Block this user? You will no longer receive messages from them.")) {
          let blocked = JSON.parse(localStorage.getItem('bapp_blocked')) || [];
          if(!blocked.includes(currentSelectedChatId)) {
              blocked.push(currentSelectedChatId);
              localStorage.setItem('bapp_blocked', JSON.stringify(blocked));
          }
          closeChatListMenu();
          if(typeof showToast === 'function') showToast("User blocked!");
      }
  }

  // --- FIX THE 3-DOT MENU DELETE LOGIC ---
  function deleteCurrentChat() {
      if (!activeChatId) return;
      if (confirm("Delete this entire chat? This will remove it from your list.")) {
          localStorage.removeItem('bapp_msgs_' + activeChatId);
          let chats = getChats();
          chats = chats.filter(id => id !== activeChatId);
          localStorage.setItem('bapp_chats', JSON.stringify(chats));
          if(typeof closeChatMenu === 'function') closeChatMenu();
          if(typeof loadChatList === 'function') loadChatList();
          if(typeof goBack === 'function') goBack();
          if(typeof showToast === 'function') showToast("Chat deleted!");
      }
  }


  // --- FINAL VIDEO FIX ---
  // This forces any broken image with a .mp4 link to become a video player
  const fixVideos = () => {
      document.querySelectorAll('#chat-messages img').forEach(img => {
          if (img.src.includes('.mp4')) {
              const video = document.createElement('video');
              video.src = img.src;
              video.controls = true;
              video.style.maxWidth = '250px'; video.style.width = 'auto';
              video.style.borderRadius = '10px';
              img.parentNode.replaceChild(video, img);
          }
      });
  };

  // Run it every time a new message appears
  const observer = new MutationObserver(() => { fixVideos(); });
  const chatBox = document.getElementById('chat-messages');
  if (chatBox) observer.observe(chatBox, { childList: true, subtree: true });

  // Also run it once when the chat opens
  setInterval(fixVideos, 1000);

  // --- KEYBOARD VISUAL VIEWPORT FIX ---
  if (window.visualViewport) {
  const handleResize = () => {
    const vv = window.visualViewport;
    const keyboardHeight = window.innerHeight - vv.height;
    
    const chatInput = document.querySelector('.chat-input-area');
    const chatHeader = document.querySelector('.chat-header');

    if (chatInput && chatHeader) {
      if (keyboardHeight > 100) {
        // Keyboard is open
        chatInput.style.bottom = (keyboardHeight + 15) + 'px';
        
        // This is the magic part: 
        // vv.offsetTop is how far the browser scrolled the page up.
        // We push the header DOWN by that exact amount so it stays on screen!
        
        chatHeader.style.transform = 'translateY(' + vv.offsetTop + 'px)';
        
        // Move the reply box up with the input
        const replyBox = document.getElementById('reply-preview');
        if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = (keyboardHeight + 80) + 'px';
        }
      } else {
        // Keyboard is closed
        chatInput.style.bottom = 'max(20px, env(safe-area-inset-bottom))';
        chatHeader.style.transform = 'translateY(0px)';
        
        // Put the reply box back down
        const replyBox = document.getElementById('reply-preview');
        if (replyBox && replyBox.style.display !== 'none') {
          replyBox.style.bottom = 'calc(max(20px, env(safe-area-inset-bottom)) + 80px)';
        }

        chatHeader.style.transform = 'translateY(0px)';
      }
    }
  };
  window.visualViewport.addEventListener('resize', handleResize);
  window.visualViewport.addEventListener('scroll', handleResize);
}
