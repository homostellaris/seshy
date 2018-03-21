/* global chrome seshyFolderId:true isFunction getSessionNameInput */

// TODO See if using Chrome messages API to communicate with Seshy lib will utilise multiple threads and therefore
// improve performance.
// ---===~ Initialisation ~===------------------------------------------------------------------------------------------
function checkIfSeshyFolderExists () {
  console.log('Checking for existing Seshy folder...')

  var query = {
    'title': 'Seshy',
    'url': null
  }
  chrome.bookmarks.search(query, (bookmarkTreeNodes) => {
    if (bookmarkTreeNodes.length === 0) {
      console.log('No existing Seshy folder, creating...')
      createSeshyFolder()
    } else if (bookmarkTreeNodes.length === 1) {
      seshyFolderId = bookmarkTreeNodes[0].id
      console.log('Seshy folder already exists with ID ' + seshyFolderId + '.')
    } else {
      console.error('More than one Session folder in Other Bookmarks!')
    }
  })
}

function createSeshyFolder () {
  var bookmark = {
    'title': 'Seshy'
  }
  chrome.bookmarks.create(bookmark, (seshyFolder) => {
    seshyFolderId = seshyFolder.id
    var message = 'Created seshy folder with ID ' + seshyFolderId + '.'
    console.log(message)
  })
}

// ---===~ Session Management ~===--------------------------------------------------------------------------------------
// Public methods
// TODO Refactor to consume session objects instead of windows.
/**
 * Save a session. Sessions can be in multiple states when they are saved.
 *
 * The session may be an unsaved one (which means they must be currently open) in which case a new session folder will
 * be created.
 *
 * The session may be saved and shelved, or saved and unshelved (currently open). In either case the existing session
 * folder will be looked up and overwritten.
 */
function saveSession (session, callback) {
  console.log('Saving tab set into bookmarks folder.')

  // TODO Replace with global function.
  var checkIfSavedSession = (session) => {
    if (session.saved()) {
      getBookmarksInFolder(session.bookmarkFolder.id)
    } else {
      createSessionFolder(session, (bookmarkTreeNode) => {
        session.bookmarkFolder = bookmarkTreeNode
        saveOpenSessionTabs(session, callStoreWindowToSessionFolderMapping)
      })
    }
  }

  var setBookmarkFolderOnSession = (bookmarkFolderId, callback) => {
    chrome.bookmarks.getSubTree(bookmarkFolderId, (bookmarkTreeNodes) => {
      session.bookmarkFolder = bookmarkTreeNodes
      callback(bookmarkFolderId)
    })
  }

  var getBookmarksInFolder = (bookmarkFolderId) => {
    chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarksInFolder)
  }

  var removeBookmarksInFolder = (bookmarkTreeNodes) => {
    removeBookmarks(bookmarkTreeNodes, callSaveTabsAsBookmarks)
  }

  var callSaveTabsAsBookmarks = () => {
    if (session.currentlyOpen()) {
      saveOpenSessionTabs(session, updateBookmarkFolderThenStoreWindowToSessionFolderMapping)
    } else {
      saveOpenSessionTabs(session, callback)
    }
  }

  var updateBookmarkFolderThenStoreWindowToSessionFolderMapping = () => {
    session.updateBookmarkFolder((bookmarkFolder) => {
      callStoreWindowToSessionFolderMapping(setSavedStateIconToSaved)
    })
  }

  var callStoreWindowToSessionFolderMapping = () => {
    storeWindowToSessionFolderMapping(session.window.id, session.bookmarkFolder.id, setSavedStateIconToSaved)
  }

  var setSavedStateIconToSaved = () => {
    session.setSavedIconState(true)
    callback()
  }

  session.updateWindow(() => {
    checkIfSavedSession(session)
  })
}

function renameSession (session, newName, callback) {
  console.log(`Renaming session ${session.name} to ${newName}.`)

  var updateSessionElement = () => {
    var sessionNameInput = getSessionNameInput(session)
    sessionNameInput.value = newName
    if (isFunction(callback)) callback()
  }

  var bookmarkFolderId = session.bookmarkFolder.id
  chrome.bookmarks.update(bookmarkFolderId, {'title': newName}, updateSessionElement)
}

/**
 * Resumes a session. The callback has no parameters.
 */
function resumeSession (session, callback) {
  function extractUrlsFromBookmarks (session) {
    var sessionFolder = session.bookmarkFolder
    var bookmarks = sessionFolder.children
    var urls = bookmarks.map((bookmark) => { return bookmark.url })
    createWindowForSession(urls)
  }

  function createWindowForSession (urls) {
    var createData = {
      'url': urls
    }
    chrome.windows.create(createData, (newWindow) => {
      if (isFunction(callback)) {
        storeWindowToSessionFolderMapping(newWindow.id, session.bookmarkFolder.id, () => {
          callback(newWindow)
        })
      } else {
        storeWindowToSessionFolderMapping(newWindow.id, session.bookmarkFolder.id)
      }
    })
  }

  if (session.window && session.window.focused) {
    window.close()
    callback()
  } else if (session.currentlyOpen()) {
    var updateInfo = {'focused': true}
    chrome.windows.update(session.window.id, updateInfo, () => {
      session.updateWindow(callback)
    })
  } else {
    extractUrlsFromBookmarks(session)
  }
}

function deleteSession (session, callback) {
  var removeSessionWindowIfOpen = () => {
    if (session.currentlyOpen()) {
      session.updateWindow(() => {
        removeWindow(session, removeBookmarkFolderIfSaved)
      })
    } else {
      removeBookmarkFolderIfSaved()
    }
  }

  var removeBookmarkFolderIfSaved = () => {
    if (session.saved()) {
      chrome.bookmarks.removeTree(session.bookmarkFolder.id, callback)
    } else {
      callback()
    }
  }

  removeSessionElement(session, removeSessionWindowIfOpen)
}

var removeSessionElement = (session, callback) => {
  session.element.remove()
  callback()
}

// TODO Is this method necessary?
/**
 * Check if the passed window is a saved session and if so callback with its bookmark folder.
 */
function getSession (windowToCheck, callback) {
  var tabs

  console.log('Checking if tab set is a saved session.')
  getTabs(windowToCheck)

  function getTabs (windowToCheck) {
    if (windowToCheck.tabs) {
      tabs = windowToCheck.tabs
      getAllSessionFolders(compareWindowWithSessionFolders)
    } else {
      chrome.tabs.getAllInWindow(windowToCheck.id, function (windowToCheckTabs) {
        tabs = windowToCheckTabs
        getAllSessionFolders(compareWindowWithSessionFolders)
      })
    }
  }

  function compareWindowWithSessionFolders (sessionFolders) {
    var matchingSessionFolder = null

    for (var i = 0; i < sessionFolders.length; i++) {
      var sessionFolder = sessionFolders[i]
      var match = compareTabsToBookmarks(tabs, sessionFolder.children)
      if (match === true) {
        matchingSessionFolder = sessionFolder
        break
      }
    }

    if (matchingSessionFolder === null) {
      console.log('No existing session found for window with ID ' + windowToCheck.id + '.')
    } else {
      console.log('Existing session found in bookmark folder with ID ' + matchingSessionFolder.id +
      ' for window with ID ' + windowToCheck.id + '.')
    }

    if (isFunction(callback)) callback(matchingSessionFolder)
  }

  function compareTabsToBookmarks (tabs, bookmarks) {
    if (tabs.length !== bookmarks.length) {
      return false
    }

    for (var i = 0; i < tabs.length && i < bookmarks.length; i++) {
      var tab = tabs[i]
      var bookmark = bookmarks[i]

      if (tab.index !== bookmark.index) {
        return false
      }
      if (tab.url !== bookmark.url) {
        return false
      }
    }
    return true
  }
}

// Private methods
function getSeshyFolder (callback) {
  var query = {
    'title': 'Seshy'
  }
  chrome.bookmarks.search(query, callback)
}

function getAllSessionFolders (callback) {
  getSeshyFolder(getSessionFolders)

  function getSessionFolders (bookmarkTreeNodes) {
    var seshyFolder = bookmarkTreeNodes[0]
    chrome.bookmarks.getSubTree(seshyFolder.id, returnChildren)
  }

  function returnChildren (seshyFolderSearchResults) {
    var seshyFolder = seshyFolderSearchResults[0]
    callback(seshyFolder.children)
  }
}

function getAllOpenWindows (callback) {
  chrome.windows.getAll({'populate': true}, callback)
}

function checkIfSavedSession (windowToCheckId, callback) {
  getWindowToSessionFolderMapping(windowToCheckId, callback)
}

function createSessionFolder (session, callback) {
  console.log(`Creating session folder for session named '${session.name}'.`)
  var bookmarkInfo = {
    'parentId': seshyFolderId,
    'title': session.name
  }
  chrome.bookmarks.create(bookmarkInfo, (bookmarkTreeNode) => {
    callback(bookmarkTreeNode)
  })
}

// TODO No need for sessionFolderId anymore.
function saveOpenSessionTabs (session, callback) {
  session.updateWindow((updatedWindow) => {
    saveTabsAsBookmarks(updatedWindow.tabs, session.bookmarkFolder.id, callback)
  })
}

// TODO Use this function in `saveSession`.
function saveWindowAsBookmarkFolder (window, bookmarkFolderId, callback) {
  var getBookmarksInFolder = (bookmarkFolderId) => {
    chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarksInFolder)
  }

  var removeBookmarksInFolder = (bookmarkTreeNodes) => {
    if (chrome.runtime.lastError) {
      console.warn('Tried to save but bookmark folder was not found. Must have been removed since the tab updated ' +
      'handler was called.')
      callback()
    } else {
      removeBookmarks(bookmarkTreeNodes, callSaveTabsAsBookmarks)
    }
  }

  var callSaveTabsAsBookmarks = () => {
    saveTabsAsBookmarks(window.tabs, bookmarkFolderId, callback)
  }

  getBookmarksInFolder(bookmarkFolderId)
}

function saveTabsAsBookmarks (tabs, bookmarkFolderId, callback) {
  console.warn('Creating %d bookmarks.', tabs.length)
  for (var i = 0; i < tabs.length; i++) {
    console.warn('Creating bookmark %d', i + 1)
    var tab = tabs[i]

    var createProperties = {
      'parentId': bookmarkFolderId,
      'title': 'Tab ' + i,
      'index': tab.index,
      'url': tab.url
    }

    if (i === tabs.length - 1) {
      chrome.bookmarks.create(createProperties, callback)
    } else {
      chrome.bookmarks.create(createProperties)
    }
  }
}

function removeBookmarks (bookmarkTreeNodes, callback) {
  console.warn('Removing %d tabs.', bookmarkTreeNodes.length)
  for (var i = 0; i < bookmarkTreeNodes.length; i++) {
    console.warn('Removing tab %d', i + 1)
    var bookmarkTreeNode = bookmarkTreeNodes[i]
    chrome.bookmarks.remove(bookmarkTreeNode.id)

    if (i === bookmarkTreeNodes.length - 1 && isFunction(callback)) {
      callback()
    }
  }
}

function removeWindow (session, callback) {
  var preventSessionManagerThinkingSessionIsOpen = () => {
    removeWindowToSessionFolderMapping(session.window.id, () => {
      chrome.windows.remove(session.window.id, callback)
    })
  }

  if (session.saved()) {
    saveSession(session, preventSessionManagerThinkingSessionIsOpen)
  } else {
    preventSessionManagerThinkingSessionIsOpen()
  }
}

// ---===~ Storage ~===-------------------------------------------------------------------------------------------------
/**
 * Callback has no args.
 */
function storeWindowToSessionFolderMapping (windowId, sessionFolderId, callback) {
  console.log('Storing window to session folder mapping.')
  var windowToSessionFolderMapping = {}
  windowToSessionFolderMapping[windowId] = sessionFolderId

  if (isFunction(callback)) {
    chrome.storage.local.set(windowToSessionFolderMapping, callback)
  } else {
    chrome.storage.local.set(windowToSessionFolderMapping)
  }
}

/**
 * The callback should take an `items` object as its parameter.
 * If nothing is found in storage for the passed `windowId` then the object will have no keys.
 */
function getWindowToSessionFolderMapping (windowId, callback) {
  chrome.storage.local.get(windowId.toString(), callback)
}

function removeWindowToSessionFolderMapping (windowId, callback) {
  chrome.storage.local.remove(windowId.toString())
  if (isFunction(callback)) callback()
}
