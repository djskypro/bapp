
  // Keep the original appendMessage safe
  const originalAppend = window.appendMessage || function(){};

  // Overwrite it globally
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    console.log("APPEND #3 CALLED: isImage=" + isImage + ", text=" + text);
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
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
      
      // Generate visible bars
      const numBars = 25;
      const bars = [];
      for(let i=0; i<numBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'wa-bar';
        // Give them a random height in pixels so they are definitely visible
        bar.style.height = (20 + Math.random() * 80) + '%'; 
        waveDiv.appendChild(bar);
        bars.push(bar);
      }
      
      playerDiv.appendChild(playBtn);
      playerDiv.appendChild(waveDiv);
      playerDiv.appendChild(timeSpan);
      
      const audio = document.createElement('audio');
      audio.src = text;
      audio.style.display = 'none';
      playerDiv.appendChild(audio);
      newMsg.appendChild(playerDiv);
      
      // Player Logic
      let isPlaying = false;
      playBtn.onclick = function() {
        if (isPlaying) {
          audio.pause();
          playBtn.innerText = '▶';
          isPlaying = false;
        } else {
          audio.play();
          playBtn.innerText = '⏸';
          playBtn.classList.add('played');
          isPlaying = true;
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
        
        // Fill bars progressively
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
    
    const spacer = document.getElementById('chat-spacer');
    if (spacer) msgBox.insertBefore(newMsg, spacer);
    else msgBox.appendChild(newMsg);
    msgBox.scrollTop = msgBox.scrollHeight;
  };

  // --- LIVE RECORDING WAVEFORM OVERRIDE ---
  // We hook into the media recorder to draw real audio
  const originalMediaRecorder = window.MediaRecorder;
  window.MediaRecorder = function(stream, options) {
    const recorder = new originalMediaRecorder(stream, options);
    
    recorder.addEventListener('start', () => {
      const canvas = document.getElementById('live-waveform');
      if (!canvas) return;
      
      canvas.style.display = 'block';
      const canvasCtx = canvas.getContext('2d');
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      
      function draw() {
        if (!canvas.style.display || canvas.style.display === 'none') return;
        requestAnimationFrame(draw);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = '#25D366'; // Green live waves
        
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;
        for(let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 2;
        }
      }
      draw();
    });

    recorder.addEventListener('stop', () => {
      const canvas = document.getElementById('live-waveform');
      if (canvas) canvas.style.display = 'none';
    });

    return recorder;
  };

  // Inject the live canvas into the UI if it's not there
  setTimeout(() => {
    if (!document.getElementById('live-waveform')) {
      const inputArea = document.querySelector('.chat-input-area');
      if (inputArea) {
        const canvas = document.createElement('canvas');
        canvas.id = 'live-waveform';
        inputArea.parentNode.insertBefore(canvas, inputArea);
      }
    }
  }, 1000);

