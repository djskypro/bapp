const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The block that currently has the ugly default audio player
const oldAudioBlock = `        } else if (isVoice || (text && text.startsWith('data:audio'))) {
          // (Audio player logic remains the same, we just reuse the original function for simplicity)
          // For this patch, we are focusing on reply/delete
          const audio = document.createElement('audio'); audio.controls = true; audio.src = text; newMsg.appendChild(audio);
        } else {`;

// The block with the beautiful custom WhatsApp waveform player
const newAudioBlock = `        } else if (isVoice || (text && text.startsWith('data:audio'))) {
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
        } else {`;

if (html.includes(oldAudioBlock)) {
    html = html.replace(oldAudioBlock, newAudioBlock);
    fs.writeFileSync('index.html', html);
    console.log('✅ Waveform player restored inside the Reply logic!');
} else {
    console.log('❌ Could not find the old audio block. Aborting to prevent crashing.');
}
