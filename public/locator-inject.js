(function() {
  // Locator state
  let isLocatorActive = false;
  let overlay = null;
  let label = null;
  let preferredIDE = 'vscode';
  let isEnabled = true;

  // IDE URL schemes
  const ideSchemes = {
    vscode: (file, line, col) => `vscode://file/${file}:${line}:${col}`,
    cursor: (file, line, col) => `cursor://file/${file}:${line}:${col}`,
    windsurf: (file, line, col) => `windsurf://file/${file}:${line}:${col}`,
    idea: (file, line, col) => `idea://open?file=${file}&line=${line}&column=${col}`,
    antigravity: (file, line, col) => `antigravity://file/${file}:${line}:${col}`
  };

  // Get React Fiber from DOM element
  function getFiberFromElement(element) {
    if (!element) return null;

    // Try React 17+ key format
    const fiberKey = Object.keys(element).find(key =>
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactInternalInstance$')
    );

    if (fiberKey) {
      return element[fiberKey];
    }

    // Try via DevTools hook
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && hook.renderers) {
      for (const [id, renderer] of hook.renderers) {
        try {
          if (renderer.findFiberByHostInstance) {
            const fiber = renderer.findFiberByHostInstance(element);
            if (fiber) return fiber;
          }
        } catch (e) {}
      }
    }

    return null;
  }

  // Get component display name
  function getDisplayName(fiber) {
    if (!fiber || !fiber.type) return 'Unknown';

    const type = fiber.type;
    if (typeof type === 'string') return type;

    return type.displayName || type.name || 'Anonymous';
  }

  // Check if fiber is a React component (not HTML element)
  function isReactComponent(fiber) {
    if (!fiber || !fiber.type) return false;
    // HTML elements have string type like 'div', 'span', 'h3'
    // React components have function/class type
    return typeof fiber.type === 'function' || typeof fiber.type === 'object';
  }

  // Extract source location from Fiber
  function getSourceFromFiber(fiber) {
    let current = fiber;

    while (current) {
      // Only consider React components, skip HTML elements
      if (isReactComponent(current)) {
        // Check _debugSource (available in dev mode)
        if (current._debugSource) {
          return {
            fileName: current._debugSource.fileName,
            lineNumber: current._debugSource.lineNumber,
            columnNumber: current._debugSource.columnNumber || 0,
            componentName: getDisplayName(current)
          };
        }
      }

      // Walk up the fiber tree
      current = current.return || current._debugOwner;
    }

    // No source found - try to find first React component for fallback
    current = fiber;
    while (current) {
      if (isReactComponent(current)) {
        const name = getDisplayName(current);
        if (name && name !== 'Unknown' && name !== 'Anonymous') {
          return {
            fileName: null,
            lineNumber: null,
            columnNumber: null,
            componentName: name,
            isRSC: true
          };
        }
      }
      current = current.return;
    }

    return null;
  }

  // Create overlay elements
  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'taillog-locator-overlay';
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      transition: all 0.05s ease-out;
      display: none;
      box-sizing: border-box;
    `;

    label = document.createElement('div');
    label.id = 'taillog-locator-label';
    label.style.cssText = `
      position: absolute;
      top: -26px;
      left: -2px;
      background: #3b82f6;
      color: white;
      padding: 3px 8px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Monaco, monospace;
      font-weight: 500;
      border-radius: 4px 4px 0 0;
      white-space: nowrap;
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    overlay.appendChild(label);
    document.body.appendChild(overlay);
  }

  // Update overlay position and content
  function updateOverlay(element, source) {
    if (!overlay || !element) return;

    const rect = element.getBoundingClientRect();

    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    if (source) {
      if (source.isRSC) {
        label.textContent = `${source.componentName} (RSC)`;
        overlay.style.borderColor = '#f59e0b';
        overlay.style.background = 'rgba(245, 158, 11, 0.1)';
        label.style.background = '#f59e0b';
      } else {
        const shortPath = source.fileName ? source.fileName.split('/').slice(-2).join('/') : '';
        label.textContent = `${source.componentName} - ${shortPath}:${source.lineNumber}`;
        overlay.style.borderColor = '#3b82f6';
        overlay.style.background = 'rgba(59, 130, 246, 0.1)';
        label.style.background = '#3b82f6';
      }
    } else {
      label.textContent = 'No React component';
      overlay.style.borderColor = '#6b7280';
      overlay.style.background = 'rgba(107, 114, 128, 0.1)';
      label.style.background = '#6b7280';
    }
  }

  // Hide overlay
  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // Resolve file path to absolute path
  function resolveFilePath(fileName) {
    if (!fileName) return null;

    let resolvedPath = fileName;

    // Remove webpack:// or similar prefixes
    resolvedPath = resolvedPath.replace(/^webpack:\/\/[^/]*/, '');
    resolvedPath = resolvedPath.replace(/^webpack-internal:\/\/\//, '');

    // Remove leading ./ if present
    resolvedPath = resolvedPath.replace(/^\.\//, '');

    return resolvedPath;
  }

  // Generate IDE URL
  function generateIDEUrl(source) {
    const { fileName, lineNumber, columnNumber, isRSC } = source;

    if (isRSC || !fileName) {
      // RSC or no source - return null, will show notification with component name
      return null;
    }

    const absolutePath = resolveFilePath(fileName);
    if (!absolutePath) {
      return null;
    }

    const generator = ideSchemes[preferredIDE] || ideSchemes.vscode;
    return generator(absolutePath, lineNumber, columnNumber || 0);
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      border-radius: 8px;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: taillog-fade-in 0.2s ease;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transition = 'opacity 0.2s ease';
      setTimeout(() => notif.remove(), 200);
    }, 2000);
  }

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes taillog-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // Throttle function
  function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn.apply(this, args);
      }
    };
  }

  // Handle mouse move
  const handleMouseMove = throttle(function(e) {
    if (!isLocatorActive || !isEnabled) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element === overlay || element === label) return;

    const fiber = getFiberFromElement(element);
    if (fiber) {
      const source = getSourceFromFiber(fiber);
      updateOverlay(element, source);
    } else {
      updateOverlay(element, null);
    }
  }, 16);

  // Handle click
  function handleClick(e) {
    // Only check e.altKey and isEnabled - don't require isLocatorActive
    // This fixes the issue where keydown event might not fire before click
    // (e.g., when clicking quickly or when window regains focus with Alt held)
    if (!e.altKey || !isEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;

    const fiber = getFiberFromElement(element);
    if (!fiber) {
      showNotification('No React component found', 'warning');
      return;
    }

    const source = getSourceFromFiber(fiber);
    if (!source) {
      showNotification('Source location not available', 'warning');
      return;
    }

    // Debug log
    console.log('[Taillog Locator] Source:', source);

    const url = generateIDEUrl(source);
    console.log('[Taillog Locator] Generated URL:', url);

    if (url) {
      showNotification(`Opening: ${source.fileName}:${source.lineNumber}`);
      window.location.href = url;
    } else {
      // No URL generated - copy component name
      navigator.clipboard.writeText(source.componentName).then(() => {
        showNotification(`"${source.componentName}" copied! (No source location available)`, 'warning');
      }).catch(() => {
        showNotification(`Component: ${source.componentName} (No source location)`, 'warning');
      });
    }
  }

  // Key handlers
  function handleKeyDown(e) {
    if (e.altKey && !isLocatorActive && isEnabled) {
      isLocatorActive = true;
      createOverlay();
      document.body.style.cursor = 'crosshair';
    }
  }

  function handleKeyUp(e) {
    if (!e.altKey && isLocatorActive) {
      isLocatorActive = false;
      hideOverlay();
      document.body.style.cursor = '';
    }
  }

  // Initialize
  function init() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    // Check for React
    setTimeout(() => {
      const hasReact = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
        document.querySelector('[data-reactroot]') ||
        Object.keys(document.body).some(k => k.startsWith('__react'));

      if (!hasReact) {
        console.log('[Taillog Locator] React not detected on this page');
      }
    }, 1000);
  }

  // Listen for settings from extension
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'taillog-locator-settings') return;

    if (event.data.type === 'settings') {
      preferredIDE = event.data.ide || 'vscode';
      isEnabled = event.data.enabled !== false;

      console.log('[Taillog Locator] Settings updated:', { preferredIDE, isEnabled });

      if (!isEnabled) {
        isLocatorActive = false;
        hideOverlay();
        document.body.style.cursor = '';
      }
    }
  });

  // Request initial settings from content script
  function requestSettings() {
    window.postMessage({
      source: 'taillog-locator',
      type: 'requestSettings'
    }, '*');
  }

  // Start
  init();

  // Request settings after initialization
  requestSettings();
})();
