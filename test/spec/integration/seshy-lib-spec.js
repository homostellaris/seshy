// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder
createSessionBookmarksFolder getAllLocalStorage openUnsavedTestSession */

describe('Seshy lib', function () {
  describe('Creating sessions.', function () {
    beforeEach(function (done) {
      spyOn(chrome.storage.local, 'remove')
      openUnsavedTestSession((session) => {
        this.session = session
        done()
      })
    })

    it('Removes window to session mappings that have the same window ID as the newly opened window.', function (done) {
      // There is an event listener on removal of windows that removes session mappings but unfortunately this does
      // not work on the last window. Chrome closes before the cleanup can be done. Must therefore check on window
      // creation too.
      expect(chrome.storage.local.remove.calls.count()).toEqual(1)
      expect(chrome.storage.local.remove.calls.argsFor(0)).toEqual([this.session.window.id.toString()])
      done()
    })
  })

  describe('Saving sessions.', function () {
    beforeEach(function (done) {
      // TODO Extract this common setup into a test-data-creator function.
      var saveTestSessionAndCaptureSessionFolder = (session) => {
        this.session = session
        saveSession(session, done)
      }

      openUnsavedTestSession(saveTestSessionAndCaptureSessionFolder)
    })

    var assertBookmarks = (expectedTabSetNumber, sessionFolderBookmarks) => {
      var expectedTabsInfo = getTabsOrBookmarksInfo(null, true, expectedTabSetNumber)
      for (var i = 0; i < sessionFolderBookmarks.length; i++) {
        var bookmark = sessionFolderBookmarks[i]
        var expectedTabInfo = expectedTabsInfo[i]
        expect(bookmark.index).toEqual(expectedTabInfo.index)
        expect(bookmark.url).toEqual(expectedTabInfo.url)
      }
    }

    it('Saves a set of tabs as bookmarks in a folder.', function () {
      this.session.updateBookmarkFolder((updatedBookmarkFolder) => {
        assertBookmarks(1, this.session.bookmarkFolder.children)
      })
    })

    it('Saves an already saved session to the same session folder as before.', function (done) {
      var assertOneSessionFolder = (callback) => {
        getAllSessionFolders((sessionFolders) => {
          expect(sessionFolders.length).toBe(1)
          callback()
        })
      }

      var saveSessionAgain = () => {
        saveSession(this.session, getSessionFolderBookmarksAndAssert)
      }

      var getSessionFolderBookmarksAndAssert = () => {
        assertOneSessionFolder(done)
        // TODO Assert is actually the same session folder.
      }

      assertOneSessionFolder(saveSessionAgain)
    })

    it('Overwrites the bookmarks in a folder when an already saved session is saved again.', function (done) {
      // TODO This is probably redundant as the window is a property of the session anyway.
      var getTestWindow = () => {
        chrome.windows.get(this.session.window.id, {'populate': true}, (testWindow) => {
          this.testWindow = testWindow
          expect(testWindow.id).toBe(this.session.window.id)
          changeOpenTabs()
        })
      }

      var changeOpenTabs = () => {
        var tabs = this.testWindow.tabs
        this.expectedTabsInfo = getTabsOrBookmarksInfo(null, false, 2)
        for (var i = 0; i < tabs.length; i++) {
          var tabId = tabs[i].id
          chrome.tabs.update(tabId, {'url': this.expectedTabsInfo[i]['url']})
        }
        setTimeout(() => {
          saveSession(this.session, getSessionFolderBookmarksAndAssert)
        }, 2000)
      }

      var getSessionFolderBookmarksAndAssert = () => {
        getSessionFolderBookmarks(this.session.bookmarkFolder, captureSessionFolderBookmarksAndAssert)
      }

      var captureSessionFolderBookmarksAndAssert = (sessionFolderBookmarks) => {
        assertBookmarks(2, sessionFolderBookmarks)
        done()
      }

      getTestWindow()
    })

    xit('Saves shelved sessions when their window is closed.', function (done) {
      console.log('Unimplemented test.')
    })

    xit('Adds a window ID to session folder ID mapping in local storage.', function (done) {
      console.log('Unimplemented test.')
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })

  describe('Resuming sessions.', function () {
    describe('User restores a session from the session manager.', function () {
      beforeEach(function (done) {
        var saveTestSessionAndCaptureSessionFolderId = (session) => {
          this.session = session
          this.bookmarksInfo = getTabsOrBookmarksInfo(this.session.window.id, false)
          saveTestSession(this.session, captureSessionFolderId)
        }

        var captureSessionFolderId = (newSessionFolderId) => {
          this.sessionFolderId = newSessionFolderId
          chrome.windows.remove(this.session.window.id, () => {
            done()
          })
        }

        openUnsavedTestSession(saveTestSessionAndCaptureSessionFolderId)
      })

      it('Adds a window ID to session folder ID mapping in local storage.', function (done) {
        var assertWindowToSessionFolderMappingAdded = (allLocalStorageObject) => {
          var allLocalStorageKeys = Object.keys(allLocalStorageObject)

          var matchingLocalStorageKey
          var matchingLocalStorageKeyValue

          for (var i = 0; i < allLocalStorageKeys.length; i++) {
            var localStorageKey = allLocalStorageKeys[i]
            // Local storage is always returned as a string but will be comparing to an integer.
            localStorageKey = parseInt(localStorageKey)

            if (localStorageKey === this.windowId) {
              matchingLocalStorageKey = localStorageKey
              matchingLocalStorageKeyValue = allLocalStorageObject[this.windowId.toString()]
            }
          }
          expect(matchingLocalStorageKey).toBe(this.windowId)
          expect(matchingLocalStorageKeyValue).toBe(this.sessionFolderId)
          done()
        }

        resumeSession(this.sessionFolderId, (newWindow) => {
          this.windowId = newWindow.id
          chrome.storage.local.get(null, assertWindowToSessionFolderMappingAdded)
        })
      })

      it('Opens a window with all the tabs as they were when the session was saved.', function (done) {
        var assertSessionRestored = (newWindow, bookmarksInfo) => {
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

        resumeSession(this.sessionFolderId, (newWindow) => {
          assertSessionRestored(newWindow, this.bookmarksInfo)
        })
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
      beforeEach(function (done) {
        var createSessionBookmarksFolderThenBookmarks = (bookmarkTreeNodes) => {
          createSessionBookmarksFolder(bookmarkTreeNodes, createBookmarks)
        }

        var createBookmarks = (bookmarksFolder) => {
          this.expectedBookmarkFolderId = bookmarksFolder.id
          var asBookmarks = true
          this.bookmarksInfo = getTabsOrBookmarksInfo(this.expectedBookmarkFolderId, asBookmarks)

          chrome.bookmarks.create(this.bookmarksInfo[0])
          chrome.bookmarks.create(this.bookmarksInfo[1])
          chrome.bookmarks.create(this.bookmarksInfo[2])
          chrome.bookmarks.create(this.bookmarksInfo[3], createWindow)
        }

        var createWindow = (bookmarkTreeNode) => {
          var tabUrls = getTabsOrBookmarksInfo(null, false, 1, true)
          var createData = {url: tabUrls}
          chrome.windows.create(createData, callTest)
        }

        var callTest = (testWindow) => {
          this.window = testWindow
          getSession(this.window, captureExistingSession) // Method under test.
        }

        var captureExistingSession = (actualBookmarkFolder) => {
          this.actualBookmarkFolderId = actualBookmarkFolder === null ? null : actualBookmarkFolder.id
          done()
        }

        getSeshyFolder(createSessionBookmarksFolderThenBookmarks)
      })

      afterEach(function (done) {
        cleanUp(done)
      })

      it('Should recognise when a set of opened tabs represents an existing session.', function () {
        expect(this.expectedBookmarkFolderId).toEqual(this.actualBookmarkFolderId)
      })
    })
  })

  describe('Ending sessions.', function () {
    beforeEach(function (done) {
      var addWindowToSessionMapping = (newWindow) => {
        this.windowId = newWindow.id
        var fakeSessionFolderId = 1
        var items = {}
        items[newWindow.id.toString()] = fakeSessionFolderId
        chrome.storage.local.set(items, done)
      }

      chrome.windows.create({}, addWindowToSessionMapping)
    })

    it('Removes any window to session folder mapping from local storage.', function (done) {
      var assertWindowToSessionFolderMappingRemoved = (allLocalStorageObject) => {
        var allLocalStorageKeys = Object.keys(allLocalStorageObject)

        var matchingLocalStorageKey = false
        var windowIdString = this.windowId.toString()

        for (var i = 0; i < allLocalStorageKeys.length; i++) {
          var localStorageKey = allLocalStorageKeys[i]
          if (localStorageKey === windowIdString) {
            matchingLocalStorageKey = true
          }
        }
        expect(matchingLocalStorageKey).toBe(false)
        done()
      }

      removeWindowToSessionFolderMapping(this.windowId, () => {
        getAllLocalStorage(assertWindowToSessionFolderMappingRemoved)
      }) // Method under test.
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })

  describe('Deleting sessions.', function () {
    beforeEach(function (done) {
      var saveTestSessionAndCaptureSessionFolderId = (newWindowId) => {
        this.windowId = newWindowId
        saveTestSession(this.windowId, captureSessionFolderId)
      }

      var captureSessionFolderId = (sessionFolderId) => {
        this.expectedDeletedSessionFolderId = sessionFolderId
        done()
      }

      openUnsavedTestSession(saveTestSessionAndCaptureSessionFolderId)
    })

    it('Deletes the session folder.', function (done) {
      var tryGetSessionFolder = (sessionFolderId) => {
        chrome.bookmarks.get(sessionFolderId.toString(), assertSessionFolderDeleted)
        this.sessionFolderDeleted = false
      }

      var assertSessionFolderDeleted = (sessionFolderId) => {
        if (chrome.runtime.lastError) {
          this.sessionFolderDeleted = true
        }
        expect(this.sessionFolderDeleted).toBe(true)
        done()
      }

      deleteSession(this.expectedDeletedSessionFolderId, tryGetSessionFolder) // Method under test.
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })
})
