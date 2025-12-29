(function() {
  // ===== 콘솔 로그 캡처 =====
  const methods = ['log', 'info', 'warn', 'error'];
  
  function safeStringify(obj) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    });
  }

  function shouldIgnore(str) {
    if (str.includes('chrome-extension://')) return true;
    if (str.includes('moz-extension://')) return true;
    if (str.includes('[HMR]')) return true;
    if (str.includes('[vite]')) return true;
    return false;
  }

  methods.forEach(method => {
    const original = console[method];
    console[method] = function(...args) {
      const argsStr = args.map(a => { try { return String(a); } catch { return ''; } }).join(' ');
      
      if (!shouldIgnore(argsStr)) {
        window.postMessage({
          source: 'taillog-extension',
          type: 'console',
          level: method,
          timestamp: new Date().toISOString(),
          payload: args.map(arg => {
            try {
              if (typeof arg === 'object') return safeStringify(arg);
              return String(arg);
            } catch { return '[Error]'; }
          })
        }, '*');
      }
      if (original) original.apply(console, args);
    };
  });

  // ===== 네트워크 요청 캡처 (Fetch) =====
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    const method = options.method || 'GET';
    let payload = null;
    
    if (options.body) {
      try {
        payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      } catch { payload = '[Body]'; }
    }
    
    const startTime = new Date().toISOString();
    
    try {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      const contentType = response.headers.get('content-type') || '';

      // Only process API responses (whitelist approach)
      const isApiResponse = contentType.includes('json') ||
                            contentType.includes('xml') ||
                            contentType.includes('text/plain') ||
                            contentType.includes('text/html');

      if (!isApiResponse) {
        window.postMessage({
          source: 'taillog-extension',
          type: 'network',
          url: url,
          method: method.toUpperCase(),
          statusCode: response.status,
          payload: payload,
          response: '[Skipped]',
          timestamp: startTime
        }, '*');
      } else {
        // Check Content-Length first (1MB limit)
        const contentLength = response.headers.get('content-length');
        const MAX_SIZE = 1024 * 1024; // 1MB

        if (contentLength && parseInt(contentLength) > MAX_SIZE) {
          window.postMessage({
            source: 'taillog-extension',
            type: 'network',
            url: url,
            method: method.toUpperCase(),
            statusCode: response.status,
            payload: payload,
            response: '[Response too large]',
            timestamp: startTime
          }, '*');
        } else {
          clonedResponse.text().then(body => {
            window.postMessage({
              source: 'taillog-extension',
              type: 'network',
              url: url,
              method: method.toUpperCase(),
              statusCode: response.status,
              payload: payload,
              response: body.length > MAX_SIZE ? body.slice(0, MAX_SIZE) + '\n...[Truncated]' : body,
              timestamp: startTime
            }, '*');
          }).catch(() => {
            window.postMessage({
              source: 'taillog-extension',
              type: 'network',
              url: url,
              method: method.toUpperCase(),
              statusCode: response.status,
              payload: payload,
              response: '[Unable to read response]',
              timestamp: startTime
            }, '*');
          });
        }
      }
      
      return response;
    } catch (error) {
      window.postMessage({
        source: 'taillog-extension',
        type: 'network',
        url: url,
        method: method.toUpperCase(),
        statusCode: 0,
        payload: payload,
        response: error.message,
        timestamp: startTime
      }, '*');
      throw error;
    }
  };

  // ===== 네트워크 요청 캡처 (XHR) =====
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._devtools = { method: method.toUpperCase(), url: url };
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    const startTime = new Date().toISOString();
    xhr._devtools.payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    xhr.addEventListener('load', function() {
      let responseData;
      try {
        // responseText throws error when responseType is not '' or 'text'
        if (xhr.responseType === '' || xhr.responseType === 'text') {
          responseData = xhr.responseText;
        } else if (xhr.responseType === 'json') {
          responseData = JSON.stringify(xhr.response);
        } else {
          responseData = '[Binary Data]';
        }
      } catch {
        responseData = '[Unable to read response]';
      }

      window.postMessage({
        source: 'taillog-extension',
        type: 'network',
        url: xhr._devtools.url,
        method: xhr._devtools.method,
        statusCode: xhr.status,
        payload: xhr._devtools.payload,
        response: responseData,
        timestamp: startTime
      }, '*');
    });

    xhr.addEventListener('error', function() {
      window.postMessage({
        source: 'taillog-extension',
        type: 'network',
        url: xhr._devtools.url,
        method: xhr._devtools.method,
        statusCode: 0,
        payload: xhr._devtools.payload,
        response: 'Network Error',
        timestamp: startTime
      }, '*');
    });

    return originalXHRSend.apply(this, [body]);
  };
})();
