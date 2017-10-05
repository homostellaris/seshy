/* global chrome getSession removeWindowToSessionFolderMapping checkIfSeshyFolderExists */
// ---===~ Add listeners. ~===------------------------------------------------------------------------------------------
chrome.windows.onCreated.addListener(windowsOnCreatedListener)
chrome.windows.onRemoved.addListener(windowsOnRemovedListener)

function windowsOnCreatedListener (windowToCheck) {
  getSession(windowToCheck)
}

function windowsOnRemovedListener (windowId) {
  removeWindowToSessionFolderMapping(windowId)
}

// ---===~ Initialisation ~===------------------------------------------------------------------------------------------
var seshyFolderId
initialise()

function initialise () {
  console.log('Initialising.')
  checkIfSeshyFolderExists()
}
