// 저장소
let consoleLogs = [];
let networkRequests = [];
const MAX_ITEMS = 10;

// 연결된 포트
const connections = {};

// 디버거가 연결된 탭
const debuggedTabs = {};

// 요청 정보 임시 저장 (requestId -> 요청 정보)
const pendingRequests = {};

// 필터링
function shouldIgnoreUrl(url) {
    if (!url) return true;
    if (url.startsWith('chrome-extension://')) return true;
    if (url.startsWith('chrome://')) return true;
    if (url.startsWith('moz-extension://')) return true;
    if (url.startsWith('data:')) return true;
    if (url.startsWith('blob:')) return true;
    return false;
}

// 브로드캐스트
function broadcast(message) {
    Object.values(connections).forEach(port => {
        try { port.postMessage(message); } catch (e) { }
    });
}

// 디버거 연결
function attachDebugger(tabId) {
    if (debuggedTabs[tabId]) return;

    chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
            console.log("Debugger attach failed:", chrome.runtime.lastError.message);
            return;
        }
        debuggedTabs[tabId] = true;
        chrome.debugger.sendCommand({ tabId }, "Network.enable", {}, () => {
            console.log("Network.enable for tab", tabId);
        });
    });
}

// 디버거 해제
function detachDebugger(tabId) {
    if (!debuggedTabs[tabId]) return;

    chrome.debugger.detach({ tabId }, () => {
        delete debuggedTabs[tabId];
    });
}

// 디버거 이벤트 리스너
chrome.debugger.onEvent.addListener((source, method, params) => {
    const tabId = source.tabId;

    // 요청 시작
    if (method === "Network.requestWillBeSent") {
        if (shouldIgnoreUrl(params.request.url)) return;

        // XHR/Fetch만 캡처
        if (params.type !== "XHR" && params.type !== "Fetch") return;

        pendingRequests[params.requestId] = {
            url: params.request.url,
            method: params.request.method,
            payload: params.request.postData || null,
            timestamp: new Date().toISOString(),
            tabId: tabId
        };
    }

    // 응답 수신
    if (method === "Network.responseReceived") {
        const reqInfo = pendingRequests[params.requestId];
        if (!reqInfo) return;

        reqInfo.statusCode = params.response.status;
        reqInfo.mimeType = params.response.mimeType;
    }

    // 로딩 완료 - response body 가져오기
    if (method === "Network.loadingFinished") {
        const reqInfo = pendingRequests[params.requestId];
        if (!reqInfo) return;

        chrome.debugger.sendCommand(
            { tabId },
            "Network.getResponseBody",
            { requestId: params.requestId },
            (response) => {
                let body = null;
                if (response) {
                    body = response.base64Encoded
                        ? atob(response.body)
                        : response.body;
                }

                const networkReq = {
                    type: 'network',
                    url: reqInfo.url,
                    method: reqInfo.method,
                    statusCode: reqInfo.statusCode || 0,
                    payload: reqInfo.payload,
                    response: body,
                    timestamp: reqInfo.timestamp
                };

                networkRequests.push(networkReq);
                if (networkRequests.length > MAX_ITEMS) networkRequests.shift();

                broadcast(networkReq);
                delete pendingRequests[params.requestId];
            }
        );
    }
});

// 탭이 닫힐 때 디버거 해제
chrome.tabs.onRemoved.addListener((tabId) => {
    detachDebugger(tabId);
    delete pendingRequests[tabId];
});

// 팝업/패널 연결
chrome.runtime.onConnect.addListener(function (port) {
    const extensionListener = function (message) {
        if (message.name === "init") {
            connections[message.tabId || port.name] = port;

            // 현재 활성 탭에 디버거 연결
            if (message.tabId && message.tabId !== "popup") {
                attachDebugger(message.tabId);
            }
        }
        if (message.name === "attachDebugger" && message.tabId) {
            attachDebugger(message.tabId);
        }
        if (message.name === "getAll") {
            port.postMessage({
                type: "allData",
                logs: consoleLogs,
                requests: networkRequests
            });
        }
    };
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function (port) {
        port.onMessage.removeListener(extensionListener);
        const keys = Object.keys(connections);
        for (let i = 0; i < keys.length; i++) {
            if (connections[keys[i]] === port) {
                delete connections[keys[i]];
                break;
            }
        }
    });
});

// Content Script에서 콘솔 로그 수신
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'console') {
        const payloadStr = (request.payload || []).join(' ');
        if (payloadStr.includes('chrome-extension://')) return true;

        consoleLogs.push(request);
        if (consoleLogs.length > MAX_ITEMS) consoleLogs.shift();

        broadcast(request);
    }
    return true;
});

// 오래된 pending request 정리
setInterval(() => {
    const now = Date.now();
    Object.keys(pendingRequests).forEach(key => {
        const req = pendingRequests[key];
        if (req.timestamp && (now - new Date(req.timestamp).getTime()) > 60000) {
            delete pendingRequests[key];
        }
    });
}, 30000);
