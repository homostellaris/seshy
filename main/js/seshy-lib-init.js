/* global chrome getSession removeWindowToSessionFolderMapping checkIfSeshyFolderExists saveWindowAsBookmarkFolder
checkIfSavedSession setBrowserActionIconToSaved isFunction asyncLoop debounceWaitTimeOverride */
const debounceWaitTime =
  typeof debounceWaitTimeOverride === 'undefined'
    ? 300
    : debounceWaitTimeOverride

function debounce (func, wait, immediate) {
  var timeout
  return function () {
    var context = this
    var args = arguments
    var later = function () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

// ---===~ Add listeners. ~===------------------------------------------------------------------------------------------
chrome.runtime.onStartup.addListener(() => {
  console.log('Startup event fired.')
})
chrome.runtime.onSuspend.addListener(() => {
  console.log('Suspend event fired.')
})

// TODO Break these methods up into multiple independent listeners.
chrome.windows.onCreated.addListener(
  debounce(
    removePotentiallyReusedWindowIdFromInternalMappingOfOpenSessions,
    debounceWaitTime,
    false
  )
)
chrome.windows.onRemoved.addListener(
  debounce(
    removeClosedSessionFromInternalMappingOfOpenSessions,
    debounceWaitTime,
    false
  )
)
chrome.windows.onFocusChanged.addListener(setBrowserActionIcon)
chrome.tabs.onUpdated.addListener(
  debounce(scheduleSaveSessionIfNecessary, debounceWaitTime, false)
)

var pendingTabUpdatedListenerCalls = 0

/**
 * The first implementation for this was dumb in that it would simply get all the tabs for the parent window, remove
 * all bookmarks from the bookmark folder, and re-create all the bookmarks based on the tabs currently in the window.
 * This did not work for several reasons...
 *
 * Creation of tabs seems to be quicker than removal of tabs. This means that if 2 tabs are created or updated in quick
 * succession then they will both trigger a series of removals and creations. A third tab change event may be triggered
 * when the creations have completed but the removals have not, meaning that at some point there are duplicate bookmarks
 * in the bookmark folder because 2 sets were created before the removals completed.
 *
 * In addition bookmark removals may be pending as other creations come through and trigger their own removals.
 * In the time it takes to get to some of the later removals an earlier pending removal may complete resulting in a
 * "can't find bookmark for id" error.
 */
function scheduleSaveSessionIfNecessary (tabId, changeInfo, tab) {
  console.log('Tab %d is %s.', tabId, changeInfo.status)

  var sessionWindowId = tab.windowId
  var bookmarkFolderId
  chrome.windows.get(sessionWindowId, {populate: true}, sessionWindow => {
    if (chrome.runtime.lastError) {
      // If tab is changed and then window removed quickly this listener can fire after the window is removed.
      removeWindowToSessionFolderMapping(sessionWindowId)
    }
    console.log(
      'Tab %d caused window %d to be retrieved with %d tabs.',
      tab.id,
      sessionWindowId,
      sessionWindow.tabs.length
    )

    checkIfSavedSession(sessionWindowId.toString(), storageObject => {
      bookmarkFolderId = storageObject[sessionWindowId]
      // `bookmarkFolderId` will be undefined and therefore falsey if no window-to-bookmark-folder-mapping exists.
      if (bookmarkFolderId) {
        setBrowserActionIconToSaving()
        pendingTabUpdatedListenerCalls++
        setTimeout(() => {
          saveSessionIfNoPendingTabUpdatedListenerCalls(
            sessionWindow,
            bookmarkFolderId
          )
        }, 1000)
      }
    })
  })
}

function saveSessionIfNoPendingTabUpdatedListenerCalls (
  sessionWindow,
  bookmarkFolderId
) {
  if (--pendingTabUpdatedListenerCalls !== 0) {
    console.log(
      '%d newer pending tab updated listener calls. Returning without trying to save.',
      pendingTabUpdatedListenerCalls
    )
    return
  }
  console.log(
    '%d newer pending tab updated listener calls. Saving session to bookmark folder.',
    pendingTabUpdatedListenerCalls
  )

  saveWindowAsBookmarkFolder(sessionWindow, bookmarkFolderId, () => {
    console.log(
      `Session with window ID ${
        sessionWindow.id
      } saved to bookmark folder with ID ${bookmarkFolderId}`
    )
    setBrowserActionIconToSaved()
  })
}

function setBrowserActionIconToUnsaved () {
  chrome.browserAction.setIcon({path: '../images/unsaved.png'})
}

function setBrowserActionIconToSaving () {
  chrome.browserAction.setIcon({path: '../images/saving.png'})
}

// TODO This may delete the mapping that was just stored by resuming a saved session. Need to move the storage from
// `resumeSession` to here so that there can't be any clash.
/**
 * Closing a window calls chrome.windows.remove so need to saveSession there somehow. But window is already gone.
 * A wrapper for chrome's window.remove method won't work because the user can effectively call that explicitly at any
 * time by closing the window.
 */
function removePotentiallyReusedWindowIdFromInternalMappingOfOpenSessions (
  windowToCheck
) {
  console.log(
    'The windows.onCreated event fired. Clearing window to session folder mapping...'
  )
  removeWindowToSessionFolderMapping(windowToCheck.id, () => {
    getSession(windowToCheck)
  })
}

/**
 * If a window-to-bookmark-folder-mapping exists then it is considered to be a saved session that is currently open.
 * It is not enough to remove the mapping when a window is opened because any logic that is executed inbetween the
 * window closing and another one opening (such as saving updated sessions) will think that sessions are still open.
 */
function removeClosedSessionFromInternalMappingOfOpenSessions (windowId) {
  console.log(
    'The windows.onRemoved event fired. Clearing window to session folder mapping...'
  )
  // Have to remove the mapping here rather than in `removeWindow` so that it
  removeWindowToSessionFolderMapping(windowId)
}

function setBrowserActionIcon (windowId) {
  var setBrowserActionIconToSavedOrUnsaved = storageObject => {
    var bookmarkFolderId = storageObject[windowId]
    if (bookmarkFolderId) {
      setBrowserActionIconToSaved()
    } else {
      setBrowserActionIconToUnsaved()
    }
  }

  checkIfSavedSession(windowId.toString(), setBrowserActionIconToSavedOrUnsaved)
}

// ---===~ Initialisation ~===------------------------------------------------------------------------------------------
var seshyFolderId
initialise()

// TODO Ensure this is loaded before anything else occurs.
// Currently it only works because it finishes before anything tries to reference seshyFolderId.
function initialise () {
  console.log('Extension started, pruning local storage...')
  pruneLocalStorage(() => {
    console.log('Local storage cleared.')
    checkIfSeshyFolderExists()
  })
}

function pruneLocalStorage (callback) {
  var getAllWindows = storageObject => {
    chrome.windows.getAll(null, windows => {
      getStorageKeysToBeRemoved(storageObject, windows)
    })
  }

  var getStorageKeysToBeRemoved = (storageObject, windows) => {
    var storedWindowIds = Object.keys(storageObject).map(windowId =>
      parseInt(windowId)
    )
    var currentlyOpenWindowIds = windows.map(aWindow => aWindow.id)
    this.windowIdsToRemove = []

    var iterateFunction = (storedWindowId, callback) => {
      if (!currentlyOpenWindowIds.includes(storedWindowId)) {
        this.windowIdsToRemove.push(storedWindowId)
      }
      callback()
    }

    asyncLoop(storedWindowIds, iterateFunction, removeStorageKeysIfNecessary)
  }

  var removeStorageKeysIfNecessary = () => {
    if (this.windowIdsToRemove) {
      var keysToRemove = this.windowIdsToRemove.map(windowId =>
        windowId.toString()
      )
      chrome.storage.local.remove(keysToRemove, () => {
        if (isFunction(callback)) callback()
      })
    } else {
      if (isFunction(callback)) callback()
    }
  }

  chrome.storage.local.get(null, getAllWindows)
}
