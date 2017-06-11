//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
chrome.windows.onCreated.addListener(windowsOnCreatedListener);
// Cannot use windows.onRemoved because window has already removed when the event fires, so cannot get tab info and
// therefore cannot save the session.
chrome.tabs.onUpdated.addListener(tabsOnUpdatedListener);

function windowsOnCreatedListener(windowToCheck) {
  checkIfExistingSession(windowToCheck);
}

function tabsOnUpdatedListener(windowToCheckId) {
  saveSession(windowToCheckId);
}

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var seshyFolderId;

initialise();
