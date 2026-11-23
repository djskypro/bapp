const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `  function openPopupChat() {`;
const scrollLogic = `  const chatListContainer = document.getElementById("chat-list-container");
  if (chatListContainer) {
    chatListContainer.addEventListener("scroll", function() {
      const replyArea = document.getElementById("msg-popup-reply-area");
      if (replyArea && replyArea.style.display === "block") {
        replyArea.style.display = "none";
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
          document.getElementById("msg-popup").classList.remove("show");
        }, 5000);
      }
    });
  }

  function openPopupChat() {`;

if (html.includes(target)) {
    html = html.replace(target, scrollLogic);
    fs.writeFileSync('index.html', html);
    console.log("✅ Scroll listener inserted safely!");
} else {
    console.log("❌ Could not find openPopupChat.");
}
