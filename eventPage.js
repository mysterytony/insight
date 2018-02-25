// load dictionary into memory
var dict = [];
var xhr = new XMLHttpRequest();
xhr.open('GET', chrome.extension.getURL('words.txt'), true);
xhr.onreadystatechange = function () {
    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        //... The content has been read in xhr.responseText
        var words = xhr.responseText.split("\n");
        for (var i in words) {
            dict.push(words[i].toLowerCase());
        }
    }
};
xhr.send();

var insights = [];

chrome.runtime.onMessage.addListener(async function (request, sender) {
    if (request.action == "getSourceText") {
        // chrome.pageAction.show(tabId);
        // textSource = request.source;
        var keywordsResponse = JSON.parse(invokeTextAnalyticsAPI(breakTextByParagraph(request.source)));
        if (!keywordsResponse) return;

        // flatten list
        var list = []
        for (var d in keywordsResponse.documents) {
            list = list.concat(keywordsResponse.documents[d].keyPhrases);
        }
        var filteredList = filterAgainstDictionary(list);

        insights = [];
        for (var i in filteredList) {
            if (insights.length >= 4) break;

            var entityResponse = JSON.parse(invokeEntitySearchAPI(filteredList[i]));
            if (entityResponse && entityResponse.entities) {
                var entity = entityResponse.entities.value[0];
                if (!entity.name || !entity.description) {
                    await sleep(145);
                    continue;
                }
                insights.push({
                    name: entity.name,
                    description: entity.description,
                    imgUrl: entity.image ? entity.image.thumbnailUrl : "",
                    searchUrl: entity.webSearchUrl
                });
            } else if (entityResponse.places) {
                var place = entityResponse.places.value[0];
                if (!place.name) {
                    await sleep(145);
                    continue;
                }
                insights.push({
                    name: place.name,
                    description: `${place.address.neighborhood} ${place.address.addressLocality} ${place.address.addressRegion}, ${place.address.addressCountry}, ${place.address.postalCode}`,
                    imgUrl: null,
                    searchUrl: place.webSearchUrl
                });
            }

            // due to limitation of API, 7 calls per second
            await sleep(145);
        }

        chrome.tabs.sendMessage(sender.tab.id, {
            action: "insightResults",
            source: insights
        });

        chrome.pageAction.show(sender.tab.id);
    }
});

// services

function invokeEntitySearchAPI(phrase) {
    var url = `https://api.cognitive.microsoft.com/bing/v7.0/entities?q=${phrase.replace(/ /g, "+")}&mkt=en-us`;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "d1afdcd159b842cdb8173f2838890fe1");
    xhr.send();
    if (xhr.status === 200) {
        return (xhr.responseText);
    }
    return null;
}

/**
 * break text into paragraphs, or even more to ensure each segment has less than or qual to 5120 chars
 * @param {string} text the text to break
 * @returns {string[]}
 */
function breakTextByParagraph(text) {
    var words = text.trim().split(" ");
    var groupedWords = [];
    var tempGrouped = ""
    for (var j = 0; j < words.length; ++j) {
        if (tempGrouped.length + words[j].length + 1 < 4900) {
            tempGrouped += (tempGrouped === "" ? "" : " ") + words[j];
        } else {
            groupedWords.push(tempGrouped);
            tempGrouped = "";
        }
    }

    if (tempGrouped) groupedWords.push(tempGrouped);
    return groupedWords;
}

/**
 * use Microsoft Cogitative API to analyze text, get list of keywords
 * @param {string[]} textSource the text to be analyzed
 */
function invokeTextAnalyticsAPI(textSource) {
    var body = {
        documents: []
    };

    for (var t = 0; t < textSource.length; ++t) {
        body.documents.push({
            language: "en",
            id: t,
            text: textSource[t]
        })
    }
    var data = JSON.stringify(body);

    var xhr = new XMLHttpRequest();

    xhr.open("POST", "https://southcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases", false);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "4f2521bd9a2c4b45b4fa2e77390095f5");
    xhr.send(data);

    if (xhr.status === 200) {
        return xhr.responseText;
    }

    return null;
}

function filterAgainstDictionary(list) {
    var filtered = [];
    for (var w in list) {
        if (dict.indexOf(list[w].toLowerCase()) == -1) { filtered.push(list[w]); }
    }
    return filtered;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
