chrome.runtime.sendMessage({
    action: "getSourceText",
    source: document.documentElement.innerText
});

var insights = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "insightResults") {
        insights = request.source;
    }
    else if (request.action == "requestInsight") {
        sendResponse(insights);
    }
});