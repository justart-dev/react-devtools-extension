// Inject main script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Send locator settings to page
function sendLocatorSettings() {
  chrome.storage.local.get(['preferredIDE', 'locatorEnabled'], (result) => {
    window.postMessage({
      source: 'taillog-locator-settings',
      type: 'settings',
      ide: result.preferredIDE || 'vscode',
      enabled: result.locatorEnabled !== false
    }, '*');
  });
}

// Listen for settings request from locator-inject.js
window.addEventListener('message', function(event) {
  if (event.source !== window || !event.data) return;
  if (event.data.source === 'taillog-locator' && event.data.type === 'requestSettings') {
    sendLocatorSettings();
  }
});

// Inject locator script
const locatorScript = document.createElement('script');
locatorScript.src = chrome.runtime.getURL('locator-inject.js');
locatorScript.onload = function() {
    this.remove();
    // Send settings after script loads
    setTimeout(sendLocatorSettings, 50);
};
(document.head || document.documentElement).appendChild(locatorScript);

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.preferredIDE || changes.locatorEnabled)) {
    sendLocatorSettings();
  }
});

window.addEventListener('message', function(event) {
  if (event.source !== window || !event.data || event.data.source !== 'taillog-extension') {
    return;
  }
  try {
    // 배치 메시지 처리
    if (event.data.type === 'batch' && Array.isArray(event.data.messages)) {
      event.data.messages.forEach(msg => {
        try {
          chrome.runtime.sendMessage({
            source: 'taillog-extension',
            ...msg
          });
        } catch(e) {}
      });
    } else {
      chrome.runtime.sendMessage(event.data);
    }
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
