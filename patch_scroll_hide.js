const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldClickEnd = `        }, 5000);
      }
    }`;

const newClickEnd = `        }, 5000);
      }
    }
  });

  // Hide the reply box when the user scrolls the chat list
  const chatListContainer = document.getElementById('chat-list-container');
  if (chatListContainer) {
    chatListContainer.addEventListener('scroll', function() {
      const replyArea = document.getElementById('msg-popup-reply-area');
      if (replyArea && replyArea.style.display === 'block') {
        replyArea.style.display = 'none';
        // Optional: Reset timer if we want the popup to stay a bit longer
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
          document.getElementById('msg-popup').classList.remove('show');
        }, 5000);
      }
    });
  }`;

if (html.includes(oldClickEnd)) {
    html = html.replace(oldClickEnd, newClickEnd);
    fs.writeFileSync('index.html', html);
    console.log("✅ Scroll hide feature added!");
} else {
    console.log("❌ Could not find the exact click block to replace.");
}
