// Copyright (c) 2014 Ken Woo. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var appState = {
	manualSwitchOn: false,
	timerOn: false,
	scheduleOn: false,
	blacklist: []
}


function initialSetup(savedState) {
	// console.log(savedState);
	if (savedState === undefined) {
		saveAppState();
	} else {
		appState = savedState;
	}
	updateApp();
}

function saveAppState() {
	// console.log(appState);
	chrome.storage.local.set({"appState": appState})
	updateApp();
}

function updateApp() {
	// console.log(appState);

	// Perform updates using app state
	if (appState.manualSwitchOn) {
		// add listener if it doesn't exist
		if (!chrome.webRequest.onBeforeRequest.hasListener(listenerCallback)) {
			chrome.webRequest.onBeforeRequest.addListener(
				listenerCallback,
				{urls: ["<all_urls>"]},
				["blocking"]
			);
		}
	} else {
		// remove listener if it exists
		if (chrome.webRequest.onBeforeRequest.hasListener(listenerCallback)) {
			chrome.webRequest.onBeforeRequest.removeListener(listenerCallback);
		}
	}
}

// Blacklist
function isInBlacklist(hostname) {
	var index = appState.blacklist.indexOf(hostname);
	return index !== -1
}

function toggleBlacklist(hostname) {

	var index = appState.blacklist.indexOf(hostname);
	if (index !== -1) {
	    appState.blacklist.splice(index, 1);
	} else {
		appState.blacklist.push(hostname)
	}

	saveAppState()
}

// Manual Switch
function isManualSwitchOn() {
	return appState.manualSwitchOn
}

function toggleManualSwitch() {
	appState.manualSwitchOn = !appState.manualSwitchOn

	saveAppState()
}



// Get saved state of app
chrome.storage.local.get("appState", function(result){
    // Showing the requested variable value
    initialSetup(result.appState);
});


// Add a listener to intercept page requests
function listenerCallback(details) {
	if (details.frameId == 0) {
		// Check if url is in blacklist
		var urlLink = document.createElement('a');
		urlLink.href = details.url;

		if (isInBlacklist(urlLink.hostname)) {
			console.log("blocked: " + details.url);
			return { redirectUrl: chrome.extension.getURL("blocked.html") };
		}
	}
}