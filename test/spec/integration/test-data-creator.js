/* global chrome saveSession resumeSession tabEqualToBookmark getSession seshyFolderId
removeWindowToSessionFolderMapping deleteSession isFunction initialise */

function saveTestSession (windowId, callback) {
  var expectedSessionFolderId

  getSeshyFolder((seshyFolder) => {
    createSessionBookmarksFolder(seshyFolder, createBookmarksThenSaveMapping)
  })

  function createBookmarksThenSaveMapping (sessionBookmarksFolder) {
    expectedSessionFolderId = sessionBookmarksFolder.id

    createBookmarks(sessionBookmarksFolder, () => {
      addWindowToSessionMapping(windowId, expectedSessionFolderId, returnSessionFolderId)
    })
  }

  function returnSessionFolderId () {
    callback(expectedSessionFolderId)
  }
}

function openUnsavedTestSession (callback, tabSetNumber) {
  chrome.windows.create({}, (newWindow) => {
    var windowId = newWindow.id
    var tabsInfo = getTabsOrBookmarksInfo(newWindow.id, false, tabSetNumber)

    if (isFunction(callback)) {
      createTabs(tabsInfo, () => {
        callback(windowId)
      })
    } else {
      createTabs(tabsInfo)
    }
  })
}

function createTabs (tabsInfo, callback) {
  chrome.tabs.create(tabsInfo[0])
  chrome.tabs.create(tabsInfo[1])
  if (isFunction(callback)) {
    chrome.tabs.create(tabsInfo[2], callback)
  } else {
    chrome.tabs.create(tabsInfo[2])
  }
}

function getTabsOrBookmarksInfo (windowOrParentId, asBookmarks, tabSetNumber) {
  var tabsInfo1 = [
    {
      'index': 0,
      'url': 'chrome://extensions/'
    },
    {
      'index': 1,
      'url': 'chrome://settings/'
    },
    {
      'index': 2,
      'url': 'chrome://about/'
    },
    {
      'index': 3,
      'url': 'chrome://newtab/'
    }
  ]
  var tabsInfo2 = [
    {
      'index': 0,
      'url': 'chrome://apps/'
    },
    {
      'index': 1,
      'url': 'chrome://downloads/'
    },
    {
      'index': 2,
      'url': 'chrome://history/'
    },
    {
      'index': 3,
      'url': 'chrome://newtab/'
    }
  ]

  var tabsInfo
  if (tabSetNumber === 2) {
    tabsInfo = tabsInfo2
  } else {
    tabsInfo = tabsInfo1
  }

  if (windowOrParentId) {
    for (var i = 0; i < tabsInfo.length; i++) {
      var tabInfo = tabsInfo[i]
      if (asBookmarks === true) {
        tabInfo.parentId = windowOrParentId
      } else {
        tabInfo.windowId = windowOrParentId
      }
    }
  }
  return tabsInfo
}

function createSessionBookmarksFolder (bookmarkTreeNodes, callback) {
  var seshyFolder = bookmarkTreeNodes[0]
  var options = {
    'parentId': seshyFolder.id, // From seshy.js
    'title': 'Test Session'
  }
  chrome.bookmarks.create(options, callback)
}

function createBookmarks (sessionBookmarksFolder, callback) {
  var asBookmarks = true
  var sessionFolderId = sessionBookmarksFolder.id
  var bookmarksInfo = getTabsOrBookmarksInfo(sessionFolderId, asBookmarks)

  chrome.bookmarks.create(bookmarksInfo[0])
  chrome.bookmarks.create(bookmarksInfo[1])
  chrome.bookmarks.create(bookmarksInfo[2])

  if (isFunction(callback)) {
    chrome.bookmarks.create(bookmarksInfo[3], () => {
      callback(bookmarksInfo)
    })
  } else {
    chrome.bookmarks.create(bookmarksInfo[3])
  }
}

function addWindowToSessionMapping (windowId, expectedSessionFolderId, callback) {
  var items = {}
  items[windowId.toString()] = expectedSessionFolderId
  chrome.storage.local.set(items, () => {
    callback()
  })
}

function cleanUp (done) {
  getSessionFolders(removeBookmarkFolders)
  removeAllWindows()
  chrome.storage.local.clear()
  // Necessary because it takes time for above operations to complete.
  setTimeout(done, 1000)
}

function getSessionFolders (callback) {
  if (isFunction(callback)) {
    chrome.bookmarks.getChildren(seshyFolderId, callback)
  } else {
    chrome.bookmarks.getChildren(seshyFolderId)
  }
}

function getSessionFolderBookmarks(sessionFolderId, callback) {
  var getSessionFolderChildren = (bookmarkTreeNodes) => {
    var sessionFolder = bookmarkTreeNodes[0]
    chrome.bookmarks.getChildren(sessionFolder.id, returnChildren)
  }

  var returnChildren = (bookmarkTreeNodes) => {
    callback(bookmarkTreeNodes)
  }

  chrome.bookmarks.getSubTree(sessionFolderId, getSessionFolderChildren)
}

function removeBookmarkFolders (bookmarkTreeNodes) {
  for (var i = 0; i < bookmarkTreeNodes.length; i++) {
    var bookmarkTreeNode = bookmarkTreeNodes[i]
    chrome.bookmarks.removeTree(bookmarkTreeNode.id)
  }
}

function removeAllWindows () {
  chrome.windows.getAll({}, removeWindows)
}

function removeWindows (windows) {
  // Don't remove first window because it will have Jasmine test results.
  for (var i = 1; i < windows.length; i++) {
    var window = windows[i]
    chrome.windows.remove(window.id)
  }
}

function getSeshyFolder (callback) {
  var query = {
    'title': 'Seshy'
  }
  chrome.bookmarks.search(query, callback)
}

// ---===~ Local storage ~===-------------------------------------------------------------------------------------------
function getAllLocalStorage (callback) {
  chrome.storage.local.get(null, callback)
}
