//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
chrome.windows.onCreated.addListener(windowsOnCreatedListener);
chrome.windows.onRemoved.addListener(windowsOnRemovedListener);
chrome.browserAction.onClicked.addListener(browserActionOnClickedListener);

function windowsOnCreatedListener(windowToCheck) {
  getSession(windowToCheck);
}

function windowsOnRemovedListener(windowId) {
  removeWindowToSessionFolderMapping(windowId);
}

function browserActionOnClickedListener(tab) {
  saveSession(tab.windowId);
}

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var seshyFolderId;
initialise();
