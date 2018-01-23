/* global chrome getSession removeWindowToSessionFolderMapping checkIfSeshyFolderExists */

// ---===~ Add listeners. ~===------------------------------------------------------------------------------------------
chrome.runtime.onStartup.addListener(function () {
  console.log('Startup event fired.')
})
chrome.runtime.onSuspend.addListener(function () {
  console.log('Suspend event fired.')
})

chrome.windows.onCreated.addListener(windowsOnCreatedListener)
chrome.windows.onRemoved.addListener(windowsOnRemovedListener)

function windowsOnCreatedListener (windowToCheck) {
  console.log('The windows.onCreated event fired. Clearing window to session folder mapping...')
  removeWindowToSessionFolderMapping(windowToCheck.id, () => {
    getSession(windowToCheck)
  })
}

function windowsOnRemovedListener (windowId) {
  console.log('The windows.onRemoved event fired. Clearing window to session folder mapping...')
  removeWindowToSessionFolderMapping(windowId)
}

// ---===~ Initialisation ~===------------------------------------------------------------------------------------------
var seshyFolderId
initialise()

// TODO Ensure this is loaded before anything else occurs.
// Currently it only works because it finishes before anything tries to reference seshyFolderId.
function initialise () {
  console.log('Extension started, clearing local storage...')
  chrome.storage.local.clear(() => {
    console.log('Local storage cleared.')
    checkIfSeshyFolderExists()
  })
}
