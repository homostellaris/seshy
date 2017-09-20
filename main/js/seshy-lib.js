/* global chrome seshyFolderId:true */

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
function saveSession (windowId) {
  var sessionWindow
  var tabs
  var sessionFolderId

  console.log('Saving tab set into bookmarks folder.')
  chrome.windows.get(windowId, {populate: true}, checkIfExistingSavedSessionThenGetSessionFolder)

  function checkIfExistingSavedSessionThenGetSessionFolder (windowToCheck) {
    sessionWindow = windowToCheck
    tabs = sessionWindow.tabs
    getWindowToSessionFolderMapping(windowId, getSessionFolder)
  }

  function getSessionFolder (existingSavedSessionMapping) {
    if (typeof existingSavedSessionMapping[sessionWindow.id] !== 'undefined') {
      removeBookmarksInFolder(existingSavedSessionMapping[sessionWindow.id])
    } else {
      createSessionFolder(sessionWindow)
    }
  }

  function createSessionFolder (sessionWindow) {
    console.log('Creating session folder for window with ID ' + sessionWindow.id + '.')

    var bookmarkInfo = {
      'parentId': seshyFolderId,
      'title': 'Test Session'
    }
    chrome.bookmarks.create(bookmarkInfo, callSaveTabsAsBookmarksWithId)

    function callSaveTabsAsBookmarksWithId (sessionFolder) {
      saveTabsAsBookmarks(sessionFolder.id)
    }
  }

  function removeBookmarksInFolder (bookmarkFolderId) {
    sessionFolderId = bookmarkFolderId
    chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarks)
  }

  function removeBookmarks (bookmarkTreeNodes) {
    for (var i = 0; i < bookmarkTreeNodes.length; i++) {
      var bookmarkTreeNode = bookmarkTreeNodes[i]
      chrome.bookmarks.remove(bookmarkTreeNode.id)

      if (i === bookmarkTreeNodes.length - 1) {
        saveTabsAsBookmarks(sessionFolderId)
      }
    }
  }

  function saveTabsAsBookmarks (newSessionFolderId) {
    sessionFolderId = newSessionFolderId
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i]

      var createProperties = {
        'parentId': sessionFolderId,
        'title': 'Tab ' + i,
        'index': tab.index,
        'url': tab.url
      }

      if (i === tabs.length - 1) {
        chrome.bookmarks.create(createProperties, callStoreWindowToSessionFolderMapping)
      } else {
        chrome.bookmarks.create(createProperties)
      }
    }
  }

  function callStoreWindowToSessionFolderMapping (bookmarkTreeNode) {
    storeWindowToSessionFolderMapping(sessionWindow.id, sessionFolderId)
  }
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
  console.log('Checking if tab set is a saved session.')

  var tabs

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

// ---===~ Storage ~===-------------------------------------------------------------------------------------------------
function storeWindowToSessionFolderMapping (windowId, sessionFolderId, callback) {
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
