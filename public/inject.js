(function() {
  'use strict';

  // ===== 1. 설정 및 상수 =====
  const CONFIG = {
    MAX_RESPONSE_SIZE: 100 * 1024,      // 100KB
    MAX_QUEUE_SIZE: 100,
    FLUSH_INTERVAL: 100,                 // 100ms
    MAX_MESSAGES_PER_FLUSH: 10,
    RATE_LIMIT_WINDOW: 1000,             // 1초
    RATE_LIMIT_PER_URL: 5,
    RATE_LIMIT_TOTAL: 50,
    CIRCUIT_BREAKER_ERRORS: 10,
    CIRCUIT_BREAKER_WINDOW: 5000,        // 5초
    CIRCUIT_BREAKER_COOLDOWN: 30000,     // 30초
    CONSOLE_THROTTLE_INTERVAL: 50        // 50ms
  };

  // ===== 2. 원본 함수 저장 =====
  const originals = {
    fetch: window.fetch,
    xhrOpen: XMLHttpRequest.prototype.open,
    xhrSend: XMLHttpRequest.prototype.send,
    console: {}
  };
  ['log', 'info', 'warn', 'error'].forEach(m => {
    originals.console[m] = console[m];
  });

  // ===== 3. 유틸리티 함수 =====
  function safeWrap(fn) {
    return function(...args) {
      try {
        return fn.apply(this, args);
      } catch (e) {
        CircuitBreaker.recordError();
        return undefined;
      }
    };
  }

  function safePostMessage(data) {
    try {
      window.postMessage(data, '*');
    } catch (e) {
      CircuitBreaker.recordError();
    }
  }

  function safeStringify(obj, maxLength = 10000) {
    try {
      const cache = new Set();
      const str = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) return '[Circular]';
          cache.add(value);
        }
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'symbol') return value.toString();
        return value;
      });
      return str && str.length > maxLength ? str.slice(0, maxLength) + '...[Truncated]' : str;
    } catch (e) {
      return '[Stringify Error]';
    }
  }

  function shouldIgnore(str) {
    if (!str) return true;
    if (str.includes('chrome-extension://')) return true;
    if (str.includes('moz-extension://')) return true;
    if (str.includes('[HMR]')) return true;
    if (str.includes('[vite]')) return true;
    if (str.includes('[Taillog]')) return true;
    return false;
  }

  function formatSize(bytes) {
    const num = parseInt(bytes);
    if (num > 1024 * 1024) return (num / (1024 * 1024)).toFixed(1) + 'MB';
    if (num > 1024) return (num / 1024).toFixed(1) + 'KB';
    return num + 'B';
  }

  // ===== 4. Circuit Breaker =====
  const CircuitBreaker = {
    errorCount: 0,
    lastCheck: Date.now(),
    isOpen: false,

    recordError() {
      const now = Date.now();
      if (now - this.lastCheck > CONFIG.CIRCUIT_BREAKER_WINDOW) {
        this.errorCount = 0;
        this.lastCheck = now;
      }
      this.errorCount++;
      if (this.errorCount >= CONFIG.CIRCUIT_BREAKER_ERRORS) {
        this.open();
      }
    },

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      if (originals.console.warn) {
        originals.console.warn('[Taillog] Circuit breaker opened - capturing disabled for 30s');
      }
      setTimeout(() => {
        this.isOpen = false;
        this.errorCount = 0;
        if (originals.console.info) {
          originals.console.info('[Taillog] Circuit breaker closed - capturing resumed');
        }
      }, CONFIG.CIRCUIT_BREAKER_COOLDOWN);
    },

    canProceed() {
      return !this.isOpen;
    }
  };

  // ===== 5. Rate Limiter =====
  const RateLimiter = {
    counts: new Map(),
    windowStart: Date.now(),
    totalCount: 0,

    shouldAllow(url) {
      if (!CircuitBreaker.canProceed()) return false;

      const now = Date.now();
      if (now - this.windowStart > CONFIG.RATE_LIMIT_WINDOW) {
        this.counts.clear();
        this.totalCount = 0;
        this.windowStart = now;
      }

      if (this.totalCount >= CONFIG.RATE_LIMIT_TOTAL) {
        return false;
      }

      try {
        const urlKey = url ? url.split('?')[0] : 'unknown';
        const count = this.counts.get(urlKey) || 0;
        if (count >= CONFIG.RATE_LIMIT_PER_URL) {
          return false;
        }
        this.counts.set(urlKey, count + 1);
      } catch (e) {
        // URL 파싱 실패 시에도 진행
      }

      this.totalCount++;
      return true;
    }
  };

  // ===== 6. Message Queue =====
  const MessageQueue = {
    queue: [],
    isProcessing: false,
    lastFlush: 0,
    flushTimer: null,

    add(message) {
      if (!CircuitBreaker.canProceed()) return;

      if (this.queue.length >= CONFIG.MAX_QUEUE_SIZE) {
        this.queue.shift();
      }
      this.queue.push(message);
      this.scheduleFlush();
    },

    scheduleFlush() {
      if (this.flushTimer) return;

      const now = Date.now();
      const elapsed = now - this.lastFlush;

      if (elapsed >= CONFIG.FLUSH_INTERVAL) {
        this.flush();
      } else {
        this.flushTimer = setTimeout(() => {
          this.flushTimer = null;
          this.flush();
        }, CONFIG.FLUSH_INTERVAL - elapsed);
      }
    },

    flush() {
      this.lastFlush = Date.now();

      const batch = this.queue.splice(0, CONFIG.MAX_MESSAGES_PER_FLUSH);
      if (batch.length === 0) return;

      if (batch.length === 1) {
        safePostMessage({
          source: 'taillog-extension',
          ...batch[0]
        });
      } else {
        safePostMessage({
          source: 'taillog-extension',
          type: 'batch',
          messages: batch
        });
      }
    }
  };

  // ===== 7. URL Filter =====
  const URLFilter = {
    blacklistPatterns: [
      /\.(png|jpg|jpeg|gif|webp|svg|ico|bmp|tiff?)(\?.*)?$/i,
      /\.(woff2?|ttf|eot|otf)(\?.*)?$/i,
      /\.(css|less|scss|sass)(\?.*)?$/i,
      /\.(mp3|mp4|webm|ogg|wav|avi|mov)(\?.*)?$/i,
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i,
      /\/sockjs-node\//i,
      /\/hot-update\./i,
      /\/webpack-hmr/i,
      /\/__webpack_hmr/i,
      /\/socket\.io\//i,
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
      /facebook\.com\/tr/i,
      /doubleclick\.net/i,
      /\.chunk\.js(\?.*)?$/i,
      /\.bundle\.js(\?.*)?$/i,
      /\.min\.js(\?.*)?$/i
    ],

    whitelistPatterns: [
      /\/api\//i,
      /\/graphql/i,
      /\/rest\//i,
      /\/v\d+\//i
    ],

    shouldCapture(url) {
      if (!url) return false;
      try {
        for (const pattern of this.whitelistPatterns) {
          if (pattern.test(url)) return true;
        }
        for (const pattern of this.blacklistPatterns) {
          if (pattern.test(url)) return false;
        }
        return true;
      } catch (e) {
        return true;
      }
    }
  };

  // ===== 8. Console Throttler =====
  const ConsoleThrottler = {
    lastLogTime: {},

    shouldLog(level) {
      const now = Date.now();
      const last = this.lastLogTime[level] || 0;
      if (now - last < CONFIG.CONSOLE_THROTTLE_INTERVAL) {
        return false;
      }
      this.lastLogTime[level] = now;
      return true;
    }
  };

  // ===== 9. 콘솔 로그 캡처 =====
  function initConsoleCapture() {
    const methods = ['log', 'info', 'warn', 'error'];

    methods.forEach(method => {
      const original = originals.console[method];

      console[method] = function(...args) {
        // 항상 원본 먼저 실행
        if (original) {
          try {
            original.apply(console, args);
          } catch (e) {
            // 원본 실행 실패해도 계속
          }
        }

        // 캡처는 별도로 (실패해도 무시)
        safeWrap(() => {
          if (!CircuitBreaker.canProceed()) return;
          if (!ConsoleThrottler.shouldLog(method)) return;

          const argsStr = args.map(a => {
            try { return String(a); }
            catch { return ''; }
          }).join(' ');

          if (shouldIgnore(argsStr)) return;

          MessageQueue.add({
            type: 'console',
            level: method,
            timestamp: new Date().toISOString(),
            payload: args.map(arg => {
              try {
                if (typeof arg === 'object') return safeStringify(arg);
                return String(arg);
              } catch { return '[Error]'; }
            })
          });
        })();
      };
    });
  }

  // ===== 10. Fetch 캡처 =====
  function initFetchCapture() {
    window.fetch = async function(...args) {
      // 캡처 데이터 준비 (실패해도 무시)
      const captureData = safeWrap(() => {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        const options = args[1] || {};
        let payload = null;

        if (options.body) {
          try {
            payload = typeof options.body === 'string' ? options.body : safeStringify(options.body);
          } catch { payload = '[Body]'; }
        }

        return {
          url: url,
          method: (options.method || 'GET').toUpperCase(),
          payload: payload,
          startTime: new Date().toISOString(),
          shouldCapture: URLFilter.shouldCapture(url) && RateLimiter.shouldAllow(url)
        };
      })();

      let response;
      let fetchError;

      // 원본 fetch 실행 (항상 실행)
      try {
        response = await originals.fetch.apply(this, args);
      } catch (e) {
        fetchError = e;
      }

      // 응답 캡처 (비동기, 실패해도 무시)
      if (captureData && captureData.shouldCapture && CircuitBreaker.canProceed()) {
        safeWrap(() => {
          captureResponseAsync(response, fetchError, captureData);
        })();
      }

      // 원본 동작 그대로 반환/throw
      if (fetchError) throw fetchError;
      return response;
    };
  }

  // 비동기 응답 캡처
  function captureResponseAsync(response, error, captureData) {
    const schedule = window.requestIdleCallback ||
                     ((fn) => setTimeout(fn, 0));

    schedule(async () => {
      try {
        let responseBody;
        let statusCode = 0;

        if (error) {
          responseBody = error.message || 'Fetch Error';
          statusCode = 0;
        } else if (response) {
          statusCode = response.status;
          responseBody = await captureResponseBody(response, captureData.url);
        } else {
          responseBody = '[No Response]';
        }

        MessageQueue.add({
          type: 'network',
          url: captureData.url,
          method: captureData.method,
          statusCode: statusCode,
          payload: captureData.payload,
          response: responseBody,
          timestamp: captureData.startTime
        });
      } catch (e) {
        CircuitBreaker.recordError();
      }
    }, { timeout: 5000 });
  }

  // 메모리 안전한 응답 캡처
  async function captureResponseBody(response, url) {
    try {
      const contentType = response.headers.get('content-type') || '';

      // 텍스트 기반 응답만 처리
      const isTextBased = contentType.includes('json') ||
                          contentType.includes('xml') ||
                          contentType.includes('text/plain') ||
                          contentType.includes('text/html') ||
                          contentType.includes('javascript');

      if (!isTextBased) {
        return '[Binary/Skipped]';
      }

      // Content-Length 체크
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > CONFIG.MAX_RESPONSE_SIZE) {
        return '[Too large: ' + formatSize(contentLength) + ']';
      }

      // 응답 복제 및 읽기
      let cloned;
      try {
        cloned = response.clone();
      } catch (e) {
        return '[Clone failed]';
      }

      // ReadableStream 사용하여 크기 제한하며 읽기
      const reader = cloned.body?.getReader();
      if (!reader) {
        return '[No body]';
      }

      const chunks = [];
      let totalSize = 0;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          totalSize += value.length;

          if (totalSize > CONFIG.MAX_RESPONSE_SIZE) {
            reader.cancel().catch(() => {});
            const partial = value.slice(0, CONFIG.MAX_RESPONSE_SIZE - (totalSize - value.length));
            chunks.push(decoder.decode(partial, { stream: true }));
            return chunks.join('') + '\n...[Truncated at 100KB]';
          }

          chunks.push(decoder.decode(value, { stream: true }));
        }
      } finally {
        reader.releaseLock();
      }

      return chunks.join('');

    } catch (e) {
      return '[Error reading response]';
    }
  }

  // ===== 11. XHR 캡처 =====
  function initXHRCapture() {
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      try {
        this._taillog = {
          method: method ? method.toUpperCase() : 'GET',
          url: url || ''
        };
      } catch (e) {
        // 실패해도 무시
      }
      return originals.xhrOpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;

      // 이미 래핑된 경우 스킵 (중복 방지)
      if (xhr._taillogWrapped) {
        return originals.xhrSend.apply(this, [body]);
      }
      xhr._taillogWrapped = true;

      // 캡처 준비 (실패해도 무시)
      safeWrap(() => {
        if (!xhr._taillog) {
          xhr._taillog = { method: 'GET', url: '' };
        }

        const url = xhr._taillog.url;
        if (!URLFilter.shouldCapture(url) || !RateLimiter.shouldAllow(url)) {
          return;
        }

        const startTime = new Date().toISOString();

        // payload 추출
        let payload = null;
        try {
          if (body) {
            payload = typeof body === 'string' ? body : safeStringify(body);
          }
        } catch (e) {
          payload = '[Body]';
        }

        // 리스너 한 번만 등록 (once: true)
        xhr.addEventListener('load', safeWrap(function() {
          if (!CircuitBreaker.canProceed()) return;

          let responseData;
          try {
            // Content-Length 체크 (안전장치)
            const contentLength = xhr.getResponseHeader('Content-Length');
            if (contentLength && parseInt(contentLength) > CONFIG.MAX_RESPONSE_SIZE) {
              responseData = '[Too large: ' + formatSize(contentLength) + ']';
            } else if (xhr.responseType === '' || xhr.responseType === 'text') {
              const text = xhr.responseText || '';
              responseData = text.length > CONFIG.MAX_RESPONSE_SIZE
                ? text.slice(0, CONFIG.MAX_RESPONSE_SIZE) + '\n...[Truncated]'
                : text;
            } else if (xhr.responseType === 'json') {
              responseData = safeStringify(xhr.response);
            } else {
              responseData = '[Binary Data]';
            }
          } catch (e) {
            responseData = '[Unable to read response]';
          }

          MessageQueue.add({
            type: 'network',
            url: xhr._taillog.url,
            method: xhr._taillog.method,
            statusCode: xhr.status,
            payload: payload,
            response: responseData,
            timestamp: startTime
          });
        }), { once: true });

        xhr.addEventListener('error', safeWrap(function() {
          if (!CircuitBreaker.canProceed()) return;

          MessageQueue.add({
            type: 'network',
            url: xhr._taillog.url,
            method: xhr._taillog.method,
            statusCode: 0,
            payload: payload,
            response: 'Network Error',
            timestamp: startTime
          });
        }), { once: true });

      })();

      // 항상 원본 실행
      return originals.xhrSend.apply(this, [body]);
    };
  }

  // ===== 12. 복구 기능 =====
  window.__taillogRestore = function() {
    try {
      window.fetch = originals.fetch;
      XMLHttpRequest.prototype.open = originals.xhrOpen;
      XMLHttpRequest.prototype.send = originals.xhrSend;
      ['log', 'info', 'warn', 'error'].forEach(m => {
        console[m] = originals.console[m];
      });
      originals.console.info('[Taillog] All original functions restored');
      return true;
    } catch (e) {
      return false;
    }
  };

  // ===== 13. 초기화 =====
  try {
    initConsoleCapture();
    initFetchCapture();
    initXHRCapture();
  } catch (e) {
    // 초기화 실패해도 사이트는 정상 동작
    if (originals.console.warn) {
      originals.console.warn('[Taillog] Failed to initialize:', e.message);
    }
  }
})();
