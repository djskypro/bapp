const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. ADD THE MISSING CSS (Force bars to be visible, Green to Black)
const newCSS = `
<style>
  /* Custom Audio Player */
  .wa-audio {
    display: flex; align-items: center; gap: 10px;
    min-width: 220px; padding: 5px 0;
  }
  .wa-play-btn {
    width: 35px; height: 35px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex; justify-content: center; align-items: center;
    font-size: 16px; color: var(--text);
    cursor: pointer; flex-shrink: 0;
  }
  .wa-play-btn.played {
    background: #53bdeb; color: white;
  }
  .wa-waveform {
    flex: 1; display: flex; align-items: center; gap: 2px;
    height: 30px; overflow: hidden;
  }
  .wa-bar {
    width: 3px; border-radius: 2px; min-height: 5px;
    background: var(--primary); /* GREEN by default */
    transition: height 0.2s, background 0.2s;
  }
  .wa-bar.played {
    background: #000000; /* BLACK when played */
  }
  .wa-time {
    font-size: 11px; color: var(--text-muted);
    margin-left: auto; min-width: 30px; text-align: right;
  }

  /* Live Recording Canvas */
  #live-waveform {
    width: 100%; height: 40px;
    background: rgba(0,0,0,0.3);
    border-radius: 10px; display: none;
    margin-top: 5px;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// 2. OVERRIDE THE MESSAGE RENDERER (To force custom audio player)
const overrideJS = `
<script>
  // Keep the original appendMessage safe
  const originalAppend = window.appendMessage || function(){};

  // Overwrite it globally
  window.appendMessage = function(text, type, timeStr, status = '', isImage = false, isVoice = false) {
    const msgBox = document.getElementById('chat-messages');
    if (!msgBox) return;
    const newMsg = document.createElement('div');
    newMsg.className = 'msg ' + type;
    
    if (isImage) {
      const img = document.createElement('img'); 
      img.src = text; 
      img.style.cursor = 'pointer';
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
      newMsg.appendChild(document.createTextNode(text));
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = timeStr || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    newMsg.appendChild(timeSpan);

    if (type === 'sent') {
      const check = document.createElement('span');
      check.className = 'msg-status ' + (status === 'read' ? 'read' : '');
      check.innerText = (status === 'read' || status === 'delivered') ? '✓✓' : '✓';
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

</script>
</body>
`;

html = html.replace('</body>', overrideJS);
fs.writeFileSync('index.html', html);
console.log('✅ Green/Black waveform player and Live Recording Canvas forced successfully!');
