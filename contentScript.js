chrome.runtime.sendMessage({
    action: "getSourceText",
    source: document.documentElement.innerText
});

