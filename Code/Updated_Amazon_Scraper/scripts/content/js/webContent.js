function openModal() {
    document.body.innerHTML += `
    <div class="scraper-info-modal">
        <div class="modal-content">
            <h1>Reviews Scraped:</h1>
            <h1 id="scraper-modal-content"></h1>
        </div>
    </div>
    `
}

chrome.storage.local.get(['startScraping', 'scrapingLimit'], function(result) {
    const { startScraping, scrapingLimit } = result;
    if (startScraping) {
        openModal();
        updateModal();
        startScrapingReviews(scrapingLimit);
    } else {
        resetStorage();
    }
});

function updateModal() {
    document.getElementById("scraper-modal-content").innerText = getScrapedCount();
}

function getScrapedCount() {
    let count = localStorage.getItem("scrapedReviews");
    if (count) count = (JSON.parse(count)).length;
    else count = "0";
    return count;
}

function startScrapingReviews(limit) {
    const elements = document.querySelectorAll("[data-hook=review]");
    if (limit) limit = Number(limit);
    else limit = 1000000000;
    if (elements.length && limit > Number(getScrapedCount())) {
        elements.forEach(item => {
            scrapeReview(item);
            updateModal();
        });
        goToNextReviewPage();
    } else {
        saveScrapedReviews();
      //  resetStorage();
    }
}


function scrapeReview(element) {
    const contentElement = element.querySelector("[data-hook=review-body] span")
    const review = {
        reviewerName: element.querySelector("[data-hook=genome-widget] .a-profile-name").innerText.replace(',',' '),
        stars: element.querySelector(".a-link-normal span").textContent.split(" ")[0],
        reviewLink: 'https://www.amazon.com/' + element.querySelector("[data-hook=review-title]").getAttribute("href"),
        reviewMeta: element.querySelector("[data-hook=review-date]").innerText.replace(',',''),
        review: contentElement ? contentElement.innerText: ""
    }
    addToReviewList(review);
}


function addToReviewList(review) {
    let scrapedReviews = localStorage.getItem("scrapedReviews");
    if (scrapedReviews) scrapedReviews = JSON.parse(scrapedReviews);
    else scrapedReviews = [];
    scrapedReviews.push(review);
    localStorage.setItem("scrapedReviews", JSON.stringify(scrapedReviews));
}


function resetStorage() {
    localStorage.removeItem("scrapedReviews");
    chrome.storage.local.clear();
}

function goToNextReviewPage() {
    const url = new URL(window.location);
    const searchQuery = getUrlParams(url.search);
    searchQuery['pageNumber'] = String(Number(searchQuery['pageNumber']) + 1);
    let newSearch = "?";
    for (let prop in searchQuery) {
        newSearch += `${prop}=${searchQuery[prop]}&`
    }
    newSearch = newSearch.slice(0, -1);
    window.location = `${url.origin}${url.pathname}${newSearch}`;
}

function getUrlParams(search) {
    const hashes = search.slice(search.indexOf('?') + 1).split('&')
    const params = {}
    hashes.map(hash => {
        const [key, val] = hash.split('=')
        params[key] = decodeURIComponent(val)
    })
    return params
}

function saveScrapedReviews() {
    const scrapedReviews = JSON.parse(localStorage.getItem("scrapedReviews"));
    const headers = {
        reviewerName: "ReviewerName",
        stars: "Stars",
        reviewLink: "ReviewLink",
        reviewTitle: "Title",
        reviewMeta: "Description",
        review: "Review"
    }
    const fileName = new URL(window.location).pathname.split("/")[2];
    exportCSVFile(headers, scrapedReviews, fileName);
}


function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

function exportCSVFile(headers, items, fileTitle) {
    if (headers) {
        items.unshift(headers);
    }

    // Convert items to CSV string
    const csv = convertToCSV(items);
    console.log(items)

    // Create a Blob with UTF-8 encoding
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // Determine the exported filename
    const exportedFilename = fileTitle + '.csv' || 'export.csv';

    // Save the Blob as a file
    if (navigator.msSaveBlob) {
        // For Internet Explorer
        navigator.msSaveBlob(blob, exportedFilename);
    } else {
        // For modern browsers
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilename);
            link.click();
        }
    }
}
