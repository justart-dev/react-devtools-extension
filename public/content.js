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
