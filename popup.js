console.log("hello popup");

// var bg = chrome.extension.getBackgroundPage();



chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
        action: "requestInsight"
    }, function (response) {
        populateInsightList(response);
    });

});

function populateInsightList(insights) {
    var insightList = document.getElementById("insight-list");
    for (var i in insights) {
        if (!insights[i]) continue;

        var insightElement = document.createElement("div");
        insightElement.className = "insight";

        if (insights[i].name) {
            var insightName = document.createElement("span");
            insightName.className = "name";
            insightName.innerText = insights[i].name;
            insightElement.appendChild(insightName);
        }

        if (insights[i].description) {
            var insightDes = document.createElement("span");
            insightDes.className = "description";
            insightDes.innerText = insights[i].description;
            insightElement.appendChild(insightDes);
        }

        if (insights[i].searchUrl) {
            var insightSearchUrl = document.createElement("a");
            insightSearchUrl.className = "searchUrl";
            insightSearchUrl.href = insights[i].searchUrl;
            insightSearchUrl.innerText = "search with Bing";
            insightSearchUrl.target = "_blank";

            insightElement.appendChild(insightSearchUrl);
        }

        if (insights[i].imgUrl) {
            var insightThumbnail = document.createElement("img");
            insightThumbnail.className = "thumbnail";
            insightThumbnail.src = insights[i].imgUrl;
            insightElement.appendChild(insightThumbnail);
        }

        insightList.appendChild(insightElement);
    }
}