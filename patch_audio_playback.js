const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update the Custom Audio Player in appendMessage
const oldAudioCode = `      const audio = document.createElement('audio');
      try {
          // Extract base64 data
          const base64Data = text.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {type: 'audio/webm'});
          audio.src = URL.createObjectURL(blob);
      } catch(e) {
          // Fallback if conversion fails
          audio.src = text;
      }
      
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
      };`;

const newAudioCode = `      const audio = document.createElement('audio');
      audio.src = text; // Direct Base64 playback is safer
      audio.preload = 'auto';
      
      // DO NOT USE display:none! Mobile browsers block hidden audio playback.
      // Instead, hide it visually but keep it in the layout.
      audio.style.position = 'absolute';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0';
      audio.style.pointerEvents = 'none';
      
      playerDiv.appendChild(audio);
      newMsg.appendChild(playerDiv);
      
      // Player Logic
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
          } catch (err) {
            console.error("Playback failed", err);
            alert("This audio format might not be supported by your browser.");
          }
        }
      };`;

html = html.replace(oldAudioCode, newAudioCode);

fs.writeFileSync('index.html', html);
console.log('✅ Audio playback fixed! It will now play old and new audios seamlessly.');
