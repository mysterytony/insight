chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        chrome.pageAction.show(tabId);
        console.log("hello")
    }
});

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.action == "getSourceText") {
        // chrome.pageAction.show(tabId);
        console.log(request.source);
    }
});

