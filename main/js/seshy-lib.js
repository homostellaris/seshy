/* global chrome seshyFolderId:true */

// TODO See if using Chrome messages API to communicate with Seshy lib will utilise multiple threads and therefore
// improve performance.
// ---===~ Initialisation ~===------------------------------------------------------------------------------------------
function checkIfSeshyFolderExists () {
  console.log('Checking for existing Seshy folder.')

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
      saveOpenSessionTabs(session, callStoreWindowToSessionFolderMapping)
    } else {
      saveOpenSessionTabs(session, callback)
    }
  }

  function callStoreWindowToSessionFolderMapping (bookmarkTreeNode) {
    if (isFunction(callback)) {
      storeWindowToSessionFolderMapping(session.window.id, session.bookmarkFolder.id, callback)
    } else {
      storeWindowToSessionFolderMapping(session.window.id, session.bookmarkFolder.id)
    }
  }

  session.updateWindow(() => {
    checkIfSavedSession(session)
  })
}

function resumeSession (sessionFolderId, callback) {
  chrome.bookmarks.getSubTree(sessionFolderId, extractUrlsFromBookmarks)

  function extractUrlsFromBookmarks (bookmarkTreeNodeResults) {
    var sessionFolder = bookmarkTreeNodeResults[0]
    var bookmarks = sessionFolder.children
    var urls = bookmarks.map((bookmark) => { return bookmark.url })
    createWindowForSession(urls)
  }

  function createWindowForSession (urls) {
    var createData = {
      'url': urls
    }
    chrome.windows.create(createData, (newWindow) => {
      storeWindowToSessionFolderMapping(newWindow.id, sessionFolderId, () => {
        callback(newWindow)
      })
    })
  }
}

function deleteSession (sessionFolderId, callback) {
  chrome.bookmarks.removeTree(sessionFolderId, () => {
    callback(sessionFolderId)
  })
}

function getSession (windowToCheck, callback) {
  var tabs

  console.log('Clearing any left over window to session folder mapping.')
  removeWindowToSessionFolderMapping(windowToCheck.id, () => {
    console.log('Checking if tab set is a saved session.')
    getTabs(windowToCheck)
  })

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

function checkIfSavedSession (windowToCheck, callback) {
  getWindowToSessionFolderMapping(windowToCheck.id, callback)
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

function saveTabsAsBookmarks (tabs, bookmarkFolderId, callback) {
  for (var i = 0; i < tabs.length; i++) {
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
  for (var i = 0; i < bookmarkTreeNodes.length; i++) {
    var bookmarkTreeNode = bookmarkTreeNodes[i]
    chrome.bookmarks.remove(bookmarkTreeNode.id)

    if (i === bookmarkTreeNodes.length - 1 && isFunction(callback)) {
      callback()
    }
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

function getWindowToSessionFolderMapping (windowId, callback) {
  chrome.storage.local.get(windowId.toString(), callback)
}

function removeWindowToSessionFolderMapping (windowId, callback) {
  chrome.storage.local.remove(windowId.toString())
  if (isFunction(callback)) callback()
}

// ---===~ Utility ~===-------------------------------------------------------------------------------------------------
function tabEqualToBookmark (tab, bookmark) {
  var indexEqual = tab.index === bookmark.index
  var urlEqual = tab.url === bookmark.url
  return indexEqual && urlEqual
}

// TODO May be some weird edge cases where this returns true in undesirable circumstances.
// https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
function isFunction (variable) {
  return typeof variable === 'function'
}
