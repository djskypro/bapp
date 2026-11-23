const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the old AI block and replace it entirely
const startAI = html.indexOf('  // --- BAPP AI LOGIC ---');
const endAI = html.indexOf('</script>', startAI);

if (startAI !== -1 && endAI !== -1) {
    const newAI = `
  // --- BAPP AI LOGIC (DEBUG VERSION) ---
  let isListening = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Force the UI to change the moment we tap
    window.startBappAI = function() {
      if (isListening) return;
      
      isListening = true;
      const orb = document.getElementById('bapp-ai-orb');
      orb.classList.add('listening');
      orb.innerText = '🎤';
      
      try {
        recognition.start();
      } catch(e) {
        console.log("Recognition already started, restarting...");
        recognition.stop();
      }
    };

    recognition.onstart = function() {
      console.log("✅ Microphone is active. Listening...");
    };

    recognition.onresult = function(event) {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      console.log('BAPP AI Heard:', speechResult);
      processBappCommand(speechResult);
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error', event.error);
      stopBappAI();
      
      // Show the user exactly what went wrong
      if (event.error === 'not-allowed') {
        alert("🔴 MIC BLOCKED! Please allow microphone permissions in your browser settings.");
      } else if (event.error === 'network') {
        alert("🔴 NETWORK ERROR! Speech recognition needs internet.");
      } else if (event.error === 'no-speech') {
        // Ignore no-speech, it just means the user didn't talk fast enough
        console.log("No speech detected.");
      } else {
        alert("🔴 AI Error: " + event.error);
      }
    };

    recognition.onend = function() {
      stopBappAI();
    };

    function stopBappAI() {
      isListening = false;
      const orb = document.getElementById('bapp-ai-orb');
      if (orb) {
          orb.classList.remove('listening');
          orb.innerText = '🤖';
      }
    }

    // --- BAPP AI BRAIN ---
    function processBappCommand(command) {
      const messageMatch = command.match(/(?:message|text|tell)\\s+([a-z0-9_]+)\\s+(.*)/i);
      const callMatch = command.match(/(?:call|phone)\\s+([a-z0-9_]+)/i);

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
      const profiles = JSON.parse(localStorage.getItem('bapp_profiles')) || {};
      let foundUserId = null;
      let foundDisplayName = null;

      for (let id in profiles) {
        if (id.toLowerCase() === targetName || (profiles[id].name && profiles[id].name.toLowerCase().includes(targetName))) {
          foundUserId = id;
          foundDisplayName = profiles[id].name || id;
          break;
        }
      }

      if (!foundUserId) {
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
        speakBappAI("I couldn't find " + targetName);
        return;
      }

      if (actionType === 'message') {
        speakBappAI("Sending message to " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            document.getElementById('chat-input').value = messageText;
            sendMessage();
        }, 1000); 
      } 
      else if (actionType === 'call') {
        speakBappAI("Calling " + foundDisplayName);
        openChat(foundUserId);
        setTimeout(() => {
            startCall('audio');
        }, 1000);
      }
    }

    function speakBappAI(text) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    }

  } else {
    window.startBappAI = function() { alert("Your browser does not support Speech Recognition."); };
  }
`;

    html = html.substring(0, startAI) + newAI + html.substring(endAI);
    fs.writeFileSync('index.html', html);
    console.log('✅ AI patched with explicit errors and instant red UI!');
} else {
    console.log('❌ Could not find the AI block to replace.');
}
