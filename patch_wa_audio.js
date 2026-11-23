const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// ==========================================
// 1. ADD CUSTOM CSS FOR WAVEFORMS
// ==========================================
const newCSS = `
<style>
  /* Custom Audio Player */
  .wa-audio {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 220px;
    padding: 5px 0;
  }
  .wa-play-btn {
    width: 35px; height: 35px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex; justify-content: center; align-items: center;
    font-size: 16px; color: var(--text);
    cursor: pointer; flex-shrink: 0;
    transition: background 0.2s;
  }
  .wa-play-btn.played {
    background: #53bdeb; /* Blue when played */
    color: white;
  }
  .wa-waveform {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2px;
    height: 30px;
    overflow: hidden;
  }
  .wa-bar {
    width: 3px;
    background: rgba(255,255,255,0.3); /* Unplayed color */
    border-radius: 2px;
    transition: height 0.2s, background 0.2s;
  }
  .wa-bar.played {
    background: #53bdeb; /* Blue played color */
  }
  .wa-time {
    font-size: 11px;
    color: var(--text-muted);
    margin-left: auto;
    min-width: 30px;
    text-align: right;
  }

  /* Live Recording Canvas */
  #live-waveform {
    width: 100%;
    height: 40px;
    background: rgba(0,0,0,0.2);
    border-radius: 10px;
  }
</style>
</head>
`;
html = html.replace('</head>', newCSS);

// ==========================================
// 2. UPDATE APPENDMESSAGE (Render Custom Player)
// ==========================================
const oldAppendVoice = `} else if (isVoice || (text && text.startsWith('data:audio'))) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = text;
      audio.style.width = '220px';
      audio.style.height = '40px';
      audio.style.outline = 'none';
      newMsg.appendChild(audio);
    }`;

const newAppendVoice = `} else if (isVoice || (text && text.startsWith('data:audio'))) {
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
    }`;

html = html.replace(oldAppendVoice, newAppendVoice);

// ==========================================
// 3. ADD LIVE RECORDING CANVAS
// ==========================================
// Insert canvas into the recording UI (if it exists)
const oldRecUI = `<div style="color:#e74c3c; font-weight:bold; font-size:16px; animation: pulse 1s infinite alternate;">🔴 Recording...</div>`;
const newRecUI = `<canvas id="live-waveform"></canvas>`;
if(html.includes(oldRecUI)) html = html.replace(oldRecUI, newRecUI);

// Add Live Canvas Drawing Logic
const oldStartRec = `mediaRecorder.start();`;
const newStartRec = `mediaRecorder.start();
        
        // Setup Live Waveform
        const canvas = document.getElementById('live-waveform');
        if(canvas) {
          const canvasCtx = canvas.getContext('2d');
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(mediaRecorder.stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          
          window.drawVisual = function() {
            if (!isRecording) {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            requestAnimationFrame(window.drawVisual);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.fillStyle = '#e74c3c';
            
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 2;
            }
          };
          window.drawVisual();
        }`;

html = html.replace(oldStartRec, newStartRec);

fs.writeFileSync('index.html', html);
console.log('✅ WhatsApp custom waveform player and live recording canvas added!');
