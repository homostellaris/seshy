// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder
createSessionBookmarksFolder getAllLocalStorage openUnsavedTestSession */

describe('Saving sessions.', function () {
  var windowId
  var bookmarks
  var tabsInfo

  beforeEach(function (done) {
    openUnsavedTestSession((newWindowId) => {
      windowId = newWindowId
      tabsInfo = getTabsOrBookmarksInfo(windowId)
      done()
    })
  })

  it('Should be able to save a set of tabs as bookmarks in a folder.', function (done) {
    callTest(done)
  })

  it('Should delete all the bookmarks in the session folder before saving an existing session.', function (done) {
    saveTestSession(windowId, () => {
      callTest(done)
    })
  })

  xit('Saves a session if it is given a name and it is not already saved.', function (done) {
    console.log('Unimplemented test.')
    done()
  })

  xit('Puts the text field for the current session\'s name into edit mode ready to be saved when the session manager ' +
  'is opened and the current session is not already saved.', function (done) {
    console.log('Unimplemented test.')
    done()
  })

  xit('Only saves sessions the user has flagged to be saved.', function (done) {
    console.log('Unimplemented test.')
    done()
  })

  afterEach(function (done) {
    cleanUp(done)
  })

  function callTest (done) {
    saveSession(windowId) // Method under test.
    setTimeout(getBookmarksFolder, 1000)

    function getBookmarksFolder () {
      var query = {
        'title': 'Test Session'
      }
      chrome.bookmarks.search(query, getBookmarks)
    }

    function getBookmarks (bookmarkSessionFolderSearchResults) {
      // Only one bookmark session folder with the correct saved tabs ensures that the original bookmarks were deleted.
      expect(bookmarkSessionFolderSearchResults.length).toEqual(1)

      chrome.bookmarks.getChildren(bookmarkSessionFolderSearchResults[0].id, function (bookmarkTreeNodes) {
        bookmarks = bookmarkTreeNodes
        assertSavedBookmarks(bookmarks, tabsInfo)
      })
    }

    function assertSavedBookmarks (bookmarks, expectedTabsInfo) {
      for (var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i]
        var expectedTabInfo = expectedTabsInfo[i]
        expect(bookmark.index).toEqual(expectedTabInfo.index)
        expect(bookmark.url).toEqual(expectedTabInfo.url)
      }
      done()
    }
  }
})

describe('Resuming sessions.', function () {
  describe('User restores a session from the session manager.', function () {
    var windowId
    var sessionFolderId
    var bookmarksInfo

    beforeEach(function (done) {
      openUnsavedTestSession(saveTestSessionAndCaptureSessionFolderId)

      function saveTestSessionAndCaptureSessionFolderId (newWindowId) {
        windowId = newWindowId
        bookmarksInfo = getTabsOrBookmarksInfo(windowId, false)
        saveTestSession(newWindowId, captureSessionFolderId)
      }

      function captureSessionFolderId (newSessionFolderId) {
        sessionFolderId = newSessionFolderId
        chrome.windows.remove(windowId, () => {
          done()
        })
      }
    })

    it('Adds a window ID to session folder ID mapping in local storage.', function (done) {
      resumeSession(sessionFolderId, (newWindow) => {
        windowId = newWindow.id
        chrome.storage.local.get(null, assertWindowToSessionFolderMappingAdded)
      })

      function assertWindowToSessionFolderMappingAdded (allLocalStorageObject) {
        var allLocalStorageKeys = Object.keys(allLocalStorageObject)

        var matchingLocalStorageKey
        var matchingLocalStorageKeyValue

        for (var i = 0; i < allLocalStorageKeys.length; i++) {
          var localStorageKey = allLocalStorageKeys[i]
          // Local storage is always returned as a string but will be comparing to an integer.
          localStorageKey = parseInt(localStorageKey)

          if (localStorageKey === windowId) {
            matchingLocalStorageKey = localStorageKey
            matchingLocalStorageKeyValue = allLocalStorageObject[windowId.toString()]
          }
        }
        expect(matchingLocalStorageKey).toBe(windowId)
        expect(matchingLocalStorageKeyValue).toBe(sessionFolderId)
        done()
      }
    })

    it('Opens a window with all the tabs as they were when the session was saved.', function (done) {
      resumeSession(sessionFolderId, (newWindow) => {
        assertSessionRestored(newWindow, bookmarksInfo)
      })

      function assertSessionRestored (newWindow, bookmarksInfo) {
        var tabs = newWindow.tabs

        var expectedTabsNumber = bookmarksInfo.length
        expect(tabs.length).toBe(expectedTabsNumber)

        var allTabsEqualToBookmarks = true
        for (var i = 0; i++; i < tabs.length) {
          var tab = tabs[i]
          var bookmark = bookmarksInfo[i]
          if (tabEqualToBookmark(tab, bookmark)) {
            var allTabsEqualBookmarks = false
          }
        }
        expect(allTabsEqualToBookmarks).toBe(true)
        done()
      }
    })

    xit('Focuses the appropriate window if the session is already open.', function (done) {
      console.log('Unimplemented test.')
      done()
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })

  describe('Identifying existing session and prompting to resume.', function () {
    // TODO set variables on `this` instead.
    var expectedSessionFolderId
    var windowToCheck
    var bookmarksInfo
    var actualSessionFolderId

    beforeEach(function (done) {
      getSeshyFolder(createSessionBookmarksFolderThenBookmarks)

      function createSessionBookmarksFolderThenBookmarks (bookmarkTreeNodes) {
        createSessionBookmarksFolder(bookmarkTreeNodes, createBookmarks)
      }

      function createBookmarks (sessionBookmarksFolder) {
        expectedSessionFolderId = sessionBookmarksFolder.id
        var asBookmarks = true
        bookmarksInfo = getTabsOrBookmarksInfo(expectedSessionFolderId, asBookmarks)

        chrome.bookmarks.create(bookmarksInfo[0])
        chrome.bookmarks.create(bookmarksInfo[1])
        chrome.bookmarks.create(bookmarksInfo[2])
        chrome.bookmarks.create(bookmarksInfo[3], createWindow)
      }

      function createWindow (bookmarkTreeNode) {
        chrome.windows.create({}, createTabs)
      }

      function createTabs (newWindow) {
        windowToCheck = newWindow
        var tabsInfo = getTabsOrBookmarksInfo(windowToCheck.id)

        chrome.tabs.create(tabsInfo[0])
        chrome.tabs.create(tabsInfo[1])
        chrome.tabs.create(tabsInfo[2], getWindow)
        // Don't create new tab as the new window creates that for us.
      }

      function getWindow () {
        chrome.windows.get(windowToCheck.id, {'populate': true}, callTest)
      }

      function callTest (uptodateWindowToCheck) {
        windowToCheck = uptodateWindowToCheck
        getSession(windowToCheck, captureExistingSession) // Method under test.
      }

      function captureExistingSession (actualSessionFolder) {
        actualSessionFolderId = actualSessionFolder === null ? null : actualSessionFolder.id
        done()
      }
    })

    afterEach(function (done) {
      cleanUp(done)
    })

    it('Should recognise when a set of opened tabs represents an existing session.', function () {
      expect(expectedSessionFolderId).toEqual(actualSessionFolderId)
    })
  })
})

describe('Ending sessions.', function () {
  var windowId

  beforeEach(function (done) {
    chrome.windows.create({}, addWindowToSessionMapping)

    function addWindowToSessionMapping (newWindow) {
      windowId = newWindow.id
      var fakeSessionFolderId = 1
      var items = {}
      items[newWindow.id.toString()] = fakeSessionFolderId
      chrome.storage.local.set(items, done)
    }
  })

  it('Removes any window to session folder mapping from local storage.', function (done) {
    removeWindowToSessionFolderMapping(windowId, () => {
      getAllLocalStorage(assertWindowToSessionFolderMappingRemoved)
    })

    function assertWindowToSessionFolderMappingRemoved (allLocalStorageObject) {
      var allLocalStorageKeys = Object.keys(allLocalStorageObject)

      var matchingLocalStorageKey = false
      var windowIdString = windowId.toString()

      for (var i = 0; i < allLocalStorageKeys.length; i++) {
        var localStorageKey = allLocalStorageKeys[i]
        if (localStorageKey === windowIdString) {
          matchingLocalStorageKey = true
        }
      }
      expect(matchingLocalStorageKey).toBe(false)
      done()
    }
  })

  afterEach(function (done) {
    cleanUp(done)
  })
})

describe('Deleting sessions.', function () {
  var windowId
  var expectedDeletedSessionFolderId

  beforeEach(function (done) {
    openUnsavedTestSession(saveTestSessionAndCaptureSessionFolderId)

    function saveTestSessionAndCaptureSessionFolderId (newWindowId) {
      windowId = newWindowId
      saveTestSession(windowId, captureSessionFolderId)

      function captureSessionFolderId (sessionFolderId) {
        expectedDeletedSessionFolderId = sessionFolderId
        done()
      }
    }
  })

  it('Deletes the session folder.', function (done) {
    deleteSession(expectedDeletedSessionFolderId, tryGetSessionFolder) // Method under test.

    function tryGetSessionFolder (sessionFolderId) {
      chrome.bookmarks.get(sessionFolderId.toString(), assertSessionFolderDeleted)
      var sessionFolderDeleted = false

      function assertSessionFolderDeleted (sessionFolderId) {
        if (chrome.runtime.lastError) {
          sessionFolderDeleted = true
        }
        expect(sessionFolderDeleted).toBe(true)
        done()
      }
    }
  })

  afterEach(function (done) {
    cleanUp(done)
  })
})
