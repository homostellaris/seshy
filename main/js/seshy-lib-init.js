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

// TODO Ensure this is loaded before anything else occurs.
// Currently it only works because it finishes before anything tries to reference seshyFolderId.
function initialise () {
  console.log('Initialising.')
  checkIfSeshyFolderExists()
}
