//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
chrome.windows.onCreated.addListener(windowsOnCreatedListener);
// Cannot use windows.onRemoved because window has already removed when the event fires, so cannot get tab info and
// therefore cannot save the session.
// Causing lots of problems with window id for non existing windows being passed.
// chrome.tabs.onUpdated.addListener(tabsOnUpdatedListener);
chrome.browserAction.onClicked.addListener(browserActionOnClickedListener);

function windowsOnCreatedListener(windowToCheck) {
  checkIfExistingSession(windowToCheck);
}

function tabsOnUpdatedListener(windowToCheckId) {
  saveSession(windowToCheckId);
}

function browserActionOnClickedListener(tab) {
  saveSession(tab.windowId);
}

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var seshyFolderId;

initialise();
