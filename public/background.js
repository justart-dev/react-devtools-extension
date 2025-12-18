// 저장소
let consoleLogs = [];
let networkRequests = [];
const MAX_ITEMS = 10;

// 연결된 포트
const connections = {};

// 브로드캐스트
function broadcast(message) {
    Object.values(connections).forEach(port => {
        try { port.postMessage(message); } catch (e) { }
    });
}

// 팝업/패널 연결
chrome.runtime.onConnect.addListener(function (port) {
    const extensionListener = function (message) {
        if (message.name === "init") {
            connections[message.tabId || port.name] = port;
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

// Content Script에서 콘솔 로그 및 네트워크 요청 수신
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'console') {
        const payloadStr = (request.payload || []).join(' ');
        if (payloadStr.includes('chrome-extension://')) return true;

        consoleLogs.push(request);
        if (consoleLogs.length > MAX_ITEMS) consoleLogs.shift();

        broadcast(request);
    }
    if (request.type === 'network') {
        networkRequests.push(request);
        if (networkRequests.length > MAX_ITEMS) networkRequests.shift();

        broadcast(request);
    }
    return true;
});
