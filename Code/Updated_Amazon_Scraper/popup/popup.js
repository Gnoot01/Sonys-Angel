function getasin(url) {
  urlobjects = url.split("/")
  var i;
  var newasin; 
  for (i = 0; i < urlobjects.length; i++) {
    if (urlobjects[i].substring(0,10) == urlobjects[i].toUpperCase().substring(0,10))
      {newasin = urlobjects[i].substring(0,10)}
    else
    {}}; 

  return newasin
  };

function getReviewURL(ACN) {
    const firstPart = 'https://www.amazon.com/product-reviews/';
    const secondPart = '/ref=cm_cr_arp_d_viewopt_srt?sortBy=recent&pageNumber=1';
    return firstPart + ACN + secondPart;
}

document.getElementById("main-form").onsubmit = function(ev) {
    ev.preventDefault();
    const value = document.querySelector("#main-form input[name=acn]").value;
    const limit = document.querySelector("#main-form input[name=limit]").value;
    if (value !== "") {
        let obj;
        if (limit !== "") obj = { startScraping: value, scrapingLimit: limit };
        else obj = { startScraping: value };
        chrome.storage.local.set(obj, function() {
            chrome.tabs.create({ url: getReviewURL(getasin(value))});
        });
    }
}