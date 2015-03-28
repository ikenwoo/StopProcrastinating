// Copyright (c) 2014 Ken Woo. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var appState = {
	manualSwitchOn: false,
	timerOn: false,
	timerEndTime: "",
	scheduleOn: false,
	blacklist: []
}


function initialSetup(savedState) {
	// console.log(savedState);
	if (savedState === undefined) {
		saveAppState();
	} else {
		// iterate through saved state to assign so we can create new data in app state
		for (var key in savedState) {
			appState[key] = savedState[key];
		}

		// create schedule data if we don't have one
		if (appState.scheduleData === undefined) {
			appState.scheduleData = createSchedule();
		}
	}
	updateApp();
}

function saveAppState() {
	// console.log(appState);
	chrome.storage.local.set({"appState": appState});
	updateApp();
}

function updateApp() {
	// console.log(appState);

	// Perform updates using app state
	if (appState.manualSwitchOn || appState.manualSwitchOn || appState.timerOn) {
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
	return index !== -1;
}

function toggleBlacklist(hostname) {

	var index = appState.blacklist.indexOf(hostname);
	if (index !== -1) {
	    appState.blacklist.splice(index, 1);
	} else {
		appState.blacklist.push(hostname);
	}

	saveAppState();
}

// Manual Switch
function isManualSwitchOn() {
	return appState.manualSwitchOn;
}

function toggleManualSwitch() {
	appState.manualSwitchOn = !appState.manualSwitchOn;

	saveAppState();
}

// Timer
function isTimerOn() {
	return appState.isTimerOn;
}

function setTimerWithMinutes(minutes) {
	appState.isTimerOn = true;

	var currentDate = new Date();
	currentDate.setMinutes(currentDate.getMinutes() + minutes);

	// store the string version
	appState.timerEndTime = currentDate.toString();

	saveAppState();
}

function isTimerComplete() {
	var timerDate = new Date(appState.timerEndTime);
	var currentDate = new Date();

	if (currentDate > timerDate) {
		return true;
	}

	return false;
}

// Schedule Switch
function isScheduleOn() {
	return appState.scheduleOn;
}

function toggleScheduleOn() {
	appState.scheduleOn = !appState.scheduleOn;

	saveAppState();
}

// Scheduling
function createSchedule() {
	var scheduleData = [];
	for (i = 0; i < 7; i++) {
		var dayOfWeek = [];
		for (j = 0; j < 48; j++) {
			dayOfWeek.push(false);
		}
		scheduleData.push(dayOfWeek);
	}

	return scheduleData;
}

function isCurrentTimeBlockedInSchedule() {
	var currentDate = new Date();
	var dayOfWeek = currentDate.getDay();
	var currentHour = currentDate.getHours();
	var currentMinute = currentDate.getMinutes();
	var currentSlot = 0;
	if (currentMinute >= 30) {
		currentSlot = 1;
	}

	var isOn = getSlotInSchedule(dayOfWeek, (currentHour * 2) + currentSlot);
	return isOn;
}

function getSlotInSchedule(dayOfWeek, slotInDay) {
	return appState.scheduleData[dayOfWeek][slotInDay];
}

function setSlotInSchedule(dayOfWeek, slotInDay,turnOn) {
	appState.scheduleData[dayOfWeek][slotInDay] = turnOn;
}

function shouldBlockNow() {
	// Check manual switch
	if (appState.manualSwitchOn) {
		return true;
	}

	// check timer
	if (appState.timerOn) {
		var isTimerDone = isTimerComplete();
		if (isTimerDone) {
			appState.timerOn = false;
			saveAppState();
		} else {
			return true;
		}
	}

	// check schedule
	if (appState.scheduleOn) {
		return isCurrentTimeBlockedInSchedule();
	}

	return false;
}

// Listener to intercept page requests
function listenerCallback(details) {
	if (details.frameId == 0) {
		// Check if url is in blacklist
		var urlLink = document.createElement('a');
		urlLink.href = details.url;

		if (isInBlacklist(urlLink.hostname)) {
			var block = shouldBlock();
			console.log("blocked: " + details.url);
			return { redirectUrl: chrome.extension.getURL("blocked.html") };
		}
	}
}

// Get saved state of app
chrome.storage.local.get("appState", function(result){
    // Showing the requested variable value
    initialSetup(result.appState);
});
