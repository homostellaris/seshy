/* global chrome saveSession resumeSession tabEqualToBookmark getSession
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

function openUnsavedTestSession (callback) {
  chrome.windows.create({}, (newWindow) => {
    var windowId = newWindow.id
    var bookmarksInfo = getTabsOrBookmarksInfo(newWindow.id, false)

    if (isFunction(callback)) {
      createTabs(bookmarksInfo, () => {
        callback(windowId)
      })
    } else {
      createTabs(bookmarksInfo)
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

  for (var i = 0; i < tabsInfo.length; i++) {
    var tabInfo = tabsInfo[i]
    if (asBookmarks === true) {
      tabInfo.parentId = windowOrParentId
    } else {
      tabInfo.windowId = windowOrParentId
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
  var bookmarksInfo = getTabsOrBookmarksInfo(sessionFolderId, asBookmarks, 2)

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
  getSeshyFolder(removeBookmarksFolder)
  // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
  setTimeout(done, 1000)
}

function getSeshyFolder (callback) {
  var query = {
    'title': 'Seshy'
  }
  chrome.bookmarks.search(query, callback)
}

function removeBookmarksFolder (bookmarkTreeNodes) {
  var bookmarksFolder = bookmarkTreeNodes[0]
  chrome.bookmarks.removeTree(bookmarksFolder.id, getAllWindows)
}

function getAllWindows () {
  chrome.windows.getAll({}, removeWindows)
}

function removeWindows (windows) {
  // Don't remove first window because it will have Jasmine test results.
  for (var i = 1; i < windows.length; i++) {
    var window = windows[i]
    chrome.windows.remove(window.id)
  }
}

function clearLocalStorageAndInitialise (callback) {
  chrome.storage.local.clear(initialise)

  var aFunction
  if (isFunction(callback)) {
    aFunction = callback
  } else {
    aFunction = () => {}
  }
  setTimeout(aFunction, 1000)
}

function getAllLocalStorage (callback) {
  chrome.storage.local.get(null, callback)
}
