/* global chrome saveSession resumeSession tabEqualToBookmark getSession seshyFolderId
removeWindowToSessionFolderMapping deleteSession isFunction initialise Session asyncLoop */

import { Session } from '/js/session-manager.js'
import { isFunction, asyncLoop, checkIfSeshyFolderExists } from '/js/util.js'

export class TestDataCreator {
  constructor () {
    checkIfSeshyFolderExists.call(this)
  }
  /**
   * Create a test session (which will create a window with some tabs) and save it (which will create a bookmark folder).
   */
  createAndSaveTestSession (callback) {
    var testSession = null

    var captureTestSessionThenSave = (session) => {
      testSession = session
      this.saveTestSession(session, captureBookmarkFolderThenCallback)
    }

    var captureBookmarkFolderThenCallback = (bookmarkFolder) => {
      callback(testSession)
    }

    this.openUnsavedTestSession(captureTestSessionThenSave)
  }

  createAndSaveThreeTestSessions (callback) {
    var sessions = []

    var callCreateAndSaveTestSession = (iterableItem, callback) => {
      this.createAndSaveTestSession((session) => {
        sessions.push(session)
        callback()
      })
    }

    var callbackWithSessions = () => {
      callback(sessions)
    }

    asyncLoop([1, 2, 3], callCreateAndSaveTestSession, callbackWithSessions)
  }

  /**
   * Save passed session and callback with bookmark folder ID.
   */
  saveTestSession (session, callback) {
    var expectedSessionFolderId

    var createBookmarksThenSaveMapping = (sessionBookmarksFolder) => {
      session.bookmarkFolder = sessionBookmarksFolder
      expectedSessionFolderId = sessionBookmarksFolder.id

      this.createBookmarks(sessionBookmarksFolder, () => {
        this.addWindowToSessionMapping(session.window.id, expectedSessionFolderId, returnSessionFolderId)
      })
    }

    var returnSessionFolderId = () => {
      callback(expectedSessionFolderId)
    }

    this.getSeshyFolder((seshyFolder) => {
      this.createSessionBookmarksFolder(seshyFolder, createBookmarksThenSaveMapping)
    })
  }

  createSessionBookmarksFolderThenBookmarks (callback) {
    var createBookmarks = (bookmarksFolder) => {
      var asBookmarks = true
      var bookmarksInfo = this.getTabsOrBookmarksInfo(bookmarksFolder.id, asBookmarks)

      chrome.bookmarks.create(bookmarksInfo[0])
      chrome.bookmarks.create(bookmarksInfo[1])
      chrome.bookmarks.create(bookmarksInfo[2])
      chrome.bookmarks.create(bookmarksInfo[3], () => {
        callback()
      })
    }

    this.getSeshyFolder((bookmarkTreeNodes) => {
      this.createSessionBookmarksFolder(bookmarkTreeNodes, createBookmarks)
    })
  }

  openUnsavedTestSession (callback, tabSetNumber) {
    tabSetNumber = tabSetNumber || 1
    var createSession = (testWindow) => {
      var session = new Session(testWindow)
      if (isFunction(callback)) callback(session)
    }

    // chrome.windows.create({}, (testWindow) => {
    //   var tabsInfo = getTabsOrBookmarksInfo(testWindow.id, false, tabSetNumber)
    //   createTabs(tabsInfo, createSession)
    // })
    var tabUrls = this.getTabsOrBookmarksInfo(null, false, tabSetNumber, true)
    var createData = {
      url: tabUrls
    }
    chrome.windows.create(createData, createSession)
  }

  openThreeUnsavedTestSessions (callback) {
    var sessions = []

    var callOpenUnsavedTestSession = (iterableItem, callback) => {
      this.openUnsavedTestSession((session) => {
        sessions.push(session)
        callback()
      })
    }

    var callbackWithSessions = () => {
      callback(sessions)
    }

    asyncLoop([1, 2, 3], callOpenUnsavedTestSession, callbackWithSessions)
  }

  createTabs (tabsInfo, callback) {
    chrome.tabs.create(tabsInfo[0])
    chrome.tabs.create(tabsInfo[1])
    if (isFunction(callback)) {
      chrome.tabs.create(tabsInfo[2], callback)
    } else {
      chrome.tabs.create(tabsInfo[2])
    }
  }

  getTabsOrBookmarksInfo (windowOrParentId, asBookmarks, tabSetNumber, urlsOnly) {
    tabSetNumber = tabSetNumber || 1
    var tabSetIndex = tabSetNumber - 1

    var tabUrls1 = [
      'chrome://extensions/',
      'chrome://settings/',
      'chrome://about/',
      'chrome://newtab/'
    ]
    var tabUrls2 = [
      'chrome://apps/',
      'chrome://downloads/',
      'chrome://history/',
      'chrome://newtab/'
    ]
    var tabUrls = [tabUrls1, tabUrls2]

    if (urlsOnly) return tabUrls[tabSetIndex]

    var tabsInfo = []
    for (var i = 0; i < 4; i++) {
      var tabInfo = {
        index: i,
        url: tabUrls[tabSetIndex][i]
      }
      if (windowOrParentId) {
        if (asBookmarks === true) {
          tabInfo.parentId = windowOrParentId
        } else {
          tabInfo.windowId = windowOrParentId
        }
      }
      tabsInfo[i] = tabInfo
    }

    return tabsInfo
  }

  createSessionBookmarksFolder (bookmarkTreeNodes, callback) {
    var seshyFolder = bookmarkTreeNodes[0]
    var options = {
      'parentId': seshyFolder.id, // From seshy.js
      'title': 'Test Session'
    }
    chrome.bookmarks.create(options, callback)
  }

  createBookmarks (sessionBookmarksFolder, callback) {
    var asBookmarks = true
    var sessionFolderId = sessionBookmarksFolder.id
    var bookmarksInfo = this.getTabsOrBookmarksInfo(sessionFolderId, asBookmarks)

    var createBookmark = (bookmarkInfo, callback) => {
      chrome.bookmarks.create(bookmarkInfo, callback)
    }

    asyncLoop(bookmarksInfo, createBookmark, callback)
  }

  addWindowToSessionMapping (windowId, expectedSessionFolderId, callback) {
    var items = {}
    items[windowId.toString()] = expectedSessionFolderId
    chrome.storage.local.set(items, () => {
      callback()
    })
  }

  cleanUp (callback) {
    var removeAllWindowsThenResetContainer = () => {
      this.removeAllWindows(() => {
        this.resetTestContainer()
        chrome.storage.local.clear(callGetSessionFolders)
      })
    }

    var callGetSessionFolders = () => {
      this.getSessionFolders((bookmarkFolders) => {
        this.removeBookmarkFolders(bookmarkFolders, callback)
      })
    }

    // This wait is necessary because some of the tests involve calling `chrome.windows.remove` which seems to callback
    // before the window is actually removed because the `chrome.windows.getAll` called by the `cleanUp` method returns
    // windows removed earlier in the test. Adding just a small wait seems to stop these windows being returned.
    setTimeout(removeAllWindowsThenResetContainer, 100)
  }

  resetTestContainer () {
    var currentlyOpenSessions = document.getElementById('currently-open-sessions')
    var savedSessions = document.getElementById('saved-sessions')
    currentlyOpenSessions.innerHTML = ''
    savedSessions.innerHTML = ''
  }

  getSessionFolders (callback) {
    if (isFunction(callback)) {
      chrome.bookmarks.getChildren(this.seshyFolderId, callback)
    } else {
      chrome.bookmarks.getChildren(this.seshyFolderId)
    }
  }

  getSessionFolderBookmarks (bookmarkFolder, callback) {
    var getSessionFolderChildren = (bookmarkTreeNodes) => {
      var sessionFolder = bookmarkTreeNodes[0]
      chrome.bookmarks.getChildren(sessionFolder.id, returnChildren)
    }

    var returnChildren = (bookmarkTreeNodes) => {
      callback(bookmarkTreeNodes)
    }

    chrome.bookmarks.getSubTree(bookmarkFolder.id, getSessionFolderChildren)
  }

  removeBookmarkFolders (bookmarkTreeNodes, callback) {
    var removeBookmarkFolder = (bookmarkFolder, callback) => {
      chrome.bookmarks.removeTree(bookmarkFolder.id, callback)
    }
    asyncLoop(bookmarkTreeNodes, removeBookmarkFolder, callback)
  }

  removeAllWindows (callback) {
    chrome.windows.getAll({}, (windows) => {
      this.removeWindows(windows, callback)
    })
  }

  removeWindows (windows, callback) {
    windows.splice(0, 1) // Remove the first window because it is the spec runner.
    var removeWindow = (sessionWindow, callback) => {
      chrome.windows.remove(sessionWindow.id, callback)
    }
    asyncLoop(windows, removeWindow, callback)
  }

  getSeshyFolder (callback) {
    var query = {
      'title': 'Seshy'
    }
    chrome.bookmarks.search(query, callback)
  }

  // ---===~ Local storage ~===-------------------------------------------------------------------------------------------
  getAllLocalStorage (callback) {
    chrome.storage.local.get(null, callback)
  }
}
