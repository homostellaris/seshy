/* global chrome getSession removeWindowToSessionFolderMapping checkIfSeshyFolderExists */

// ---===~ Add listeners. ~===------------------------------------------------------------------------------------------
console.log('Extension started, clearing local storage.')
chrome.storage.local.clear(function () {
  console.log('Local storage cleared.')
})

chrome.runtime.onStartup.addListener(function () {
  console.log('Startup event fired.')
})
chrome.runtime.onSuspend.addListener(function () {
  console.log('Suspend event fired.')
})

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
