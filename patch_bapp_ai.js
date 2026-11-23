const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add the AI Orb HTML and CSS
const aiHTML = `
<style>
  #bapp-ai-orb {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #25D366, #005c4b);
    box-shadow: 0 0 20px rgba(37, 211, 102, 0.6), inset 0 0 10px rgba(255,255,255,0.5);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 30px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    animation: floatOrb 3s ease-in-out infinite;
  }
  #bapp-ai-orb.listening {
    animation: pulseOrb 1s infinite alternate;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    box-shadow: 0 0 40px rgba(231, 76, 60, 0.8);
  }
  @keyframes floatOrb {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
  }
  @keyframes pulseOrb {
    0% { transform: scale(1); }
    100% { transform: scale(1.1); }
  }
</style>
<div id="bapp-ai-orb" onclick="startBappAI()">🤖</div>
</body>`;
html = html.replace('</body>', aiHTML);

// 2. Add the AI JavaScript Logic
const aiJS = `
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
      const messageMatch = command.match(/(?:message|text|tell)\\s+([a-z0-9_]+)\\s+(.*)/i);
      // Pattern 2: Call (e.g., "call kevin")
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
            document.getElementById('chat-input').value = messageText;
            sendMessage();
        }, 800); // Wait for chat to open
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
`;

const lastScriptIdx = html.lastIndexOf('</script>');
if(lastScriptIdx !== -1) {
    html = html.substring(0, lastScriptIdx) + aiJS + html.substring(lastScriptIdx);
    fs.writeFileSync('index.html', html);
    console.log('✅ BAPP AI successfully activated!');
} else {
    console.log('❌ Could not find script tag.');
}
