

  function openChatMenu() {
    const menu = document.getElementById('chat-options-menu');
    const drawer = document.getElementById('chat-menu-drawer');
    if(menu && drawer) {
      menu.style.display = 'block';
      setTimeout(() => {
        drawer.style.transform = 'scale(1) translateY(0)';
        drawer.style.opacity = '1';
      }, 10);
    }
  }

  function closeChatMenu() {
    const menu = document.getElementById('chat-options-menu');
    const drawer = document.getElementById('chat-menu-drawer');
    if(menu && drawer) {
      drawer.style.transform = 'scale(0.95) translateY(-10px)';
      drawer.style.opacity = '0';
      setTimeout(() => {
        menu.style.display = 'none';
      }, 200);
    }
  }

