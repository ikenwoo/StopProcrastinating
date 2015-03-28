// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 **/
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

var hostname = ""

function toggleHostInBlacklist() {
  chrome.extension.getBackgroundPage().toggleBlacklist(hostname)
  renderPopup();
}

function toggleManualSwitch() {
  chrome.extension.getBackgroundPage().toggleManualSwitch()

  renderPopup();
}

function initWithUrl(url) {
  // setup states
  hostname = url; // => "example.com"

    // Check if we are on schedule to block

    // Check the url to add to block list

    // Check if we need to block the site

  if (hostname != "") {
    // Setup javascript hooks to popup.html
    document.getElementById('site-button').onclick = function(){
        toggleHostInBlacklist()
    }
  }

  document.getElementById('manual-switch').onclick = function(){
      toggleManualSwitch()
  }

  // initial render
  renderPopup()  
}

function renderPopup() {
  if (hostname != "") {
    document.getElementById('site-url').textContent = hostname;

    if (chrome.extension.getBackgroundPage().isInBlacklist(hostname)) {
      document.getElementById('site-button').textContent = "Remove from Timewasters!";
    } else {
      document.getElementById('site-button').textContent = "Add to Timewasters!";
    }
  }

  if (chrome.extension.getBackgroundPage().isManualSwitchOn()) {
    document.getElementById('manual-switch').textContent = "Turn Off";
  } else {
    document.getElementById('manual-switch').textContent = "Turn On";
  }
}


document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    // Setup url
    var urlLink = document.createElement('a');
    urlLink.href = url;
    var urlHost = urlLink.hostname;

    // only block http or https requests
    if (urlLink.protocol != "http:" && urlLink.protocol != "https:") {
      var element = document.getElementById('site-section');
      element.parentNode.removeChild(element);
      urlHost = ""
    }

    initWithUrl(urlHost);
  });
});


