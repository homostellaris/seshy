// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder
createSessionBookmarksFolder getAllLocalStorage openUnsavedTestSession */

describe('Seshy lib', function () {
  describe('Creating sessions.', function () {
    beforeEach(function (done) {
      spyOn(chrome.storage.local, 'remove')
      openUnsavedTestSession((windowId) => {
        this.windowId = windowId
        done()
      })
    })

    it('Removes window to session mappings that have the same window ID as the newly opened window.', function (done) {
      // There is an event listener on removal of windows that removes session mappings but unfortunately this does
      // not work on the last window. Chrome closes before the cleanup can be done. Must therefore check on window
      // creation too.
      expect(chrome.storage.local.remove.calls.count()).toEqual(1)
      expect(chrome.storage.local.remove.calls.argsFor(0)).toEqual([this.windowId.toString()])
      done()
    })
  })

  describe('Saving sessions.', function () {
    beforeEach(function (done) {
      // TODO Extract this common setup into a test-data-creator function.
      var saveTestSessionAndCaptureSessionFolder = (newWindowId) => {
        this.windowId = newWindowId
        saveTestSession(this.windowId, (sessionFolderId) => {
          this.sessionFolderId = sessionFolderId
          getSessionFolderBookmarks(sessionFolderId, captureSessionFolderBookmarks)
        })
      }

      var captureSessionFolderBookmarks = (sessionFolderBookmarks) => {
        this.sessionFolderBookmarks = sessionFolderBookmarks
        done()
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

    it('Should be able to save a set of tabs as bookmarks in a folder.', function () {
      assertBookmarks(1, this.sessionFolderBookmarks)
    })

    it('Should save an already saved session to the same session folder as before.', function (done) {
      var assertOneSessionFolder = (callback) => {
        getAllSessionFolders((sessionFolders) => {
          expect(sessionFolders.length).toBe(1)
          callback()
        })
      }

      var saveSessionAgain = () => {
        saveSession(this.windowId, getSessionFolderBookmarksAndAssert)
      }

      var getSessionFolderBookmarksAndAssert = (sessionFolderId) => {
        assertOneSessionFolder(done)
      }

      assertOneSessionFolder(saveSessionAgain)
    })

    it('Should overwrite the bookmarks in a folder when an already saved session is saved again.', function (done) {
      var getTestWindow = () => {
        chrome.windows.get(this.windowId, {'populate': true}, (testWindow) => {
          this.testWindow = testWindow
          expect(testWindow.id).toBe(this.windowId)
          changeOpenTabs()
        })
      }

      var changeOpenTabs = () => {
        var tabs = this.testWindow.tabs
        this.expectedTabsInfo = getTabsOrBookmarksInfo(null, false, 2)
        for (var i = 0; i < tabs.length; i++) {
          var tabId = tabs[i].id
          // if (i === tabs.length - 1) {
          //   chrome.tabs.update(tabId, {'url': this.expectedTabsInfo[i]['url']}, (tab) => {
          //     saveSession(this.testWindow.id, getSessionFolderBookmarksAndAssert)
          //   })
          // } else {
          //   chrome.tabs.update(tabId, {'url': this.expectedTabsInfo[i]['url']})
          // }
          chrome.tabs.update(tabId, {'url': this.expectedTabsInfo[i]['url']})
        }
        setTimeout(() => {
          saveSession(this.testWindow.id, getSessionFolderBookmarksAndAssert)
        }, 2000)
      }

      var getSessionFolderBookmarksAndAssert = () => {
        getSessionFolderBookmarks(this.sessionFolderId, captureSessionFolderBookmarksAndAssert)
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
        var saveTestSessionAndCaptureSessionFolderId = (newWindowId) => {
          this.windowId = newWindowId
          this.bookmarksInfo = getTabsOrBookmarksInfo(this.windowId, false)
          saveTestSession(this.windowId, captureSessionFolderId)
        }

        var captureSessionFolderId = (newSessionFolderId) => {
          this.sessionFolderId = newSessionFolderId
          chrome.windows.remove(this.windowId, () => {
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

        var createBookmarks = (sessionBookmarksFolder) => {
          this.expectedSessionFolderId = sessionBookmarksFolder.id
          var asBookmarks = true
          this.bookmarksInfo = getTabsOrBookmarksInfo(this.expectedSessionFolderId, asBookmarks)

          chrome.bookmarks.create(this.bookmarksInfo[0])
          chrome.bookmarks.create(this.bookmarksInfo[1])
          chrome.bookmarks.create(this.bookmarksInfo[2])
          chrome.bookmarks.create(this.bookmarksInfo[3], createWindow)
        }

        var createWindow = (bookmarkTreeNode) => {
          chrome.windows.create({}, createTabs)
        }

        var createTabs = (newWindow) => {
          this.windowToCheck = newWindow
          var tabsInfo = getTabsOrBookmarksInfo(this.windowToCheck.id)

          chrome.tabs.create(tabsInfo[0])
          chrome.tabs.create(tabsInfo[1])
          chrome.tabs.create(tabsInfo[2], getWindow)
          // Don't create new tab as the new window creates that for us.
        }

        var getWindow = () => {
          chrome.windows.get(this.windowToCheck.id, {'populate': true}, callTest)
        }

        var callTest = (uptodateWindowToCheck) => {
          this.windowToCheck = uptodateWindowToCheck
          getSession(this.windowToCheck, captureExistingSession) // Method under test.
        }

        var captureExistingSession = (actualSessionFolder) => {
          this.actualSessionFolderId = actualSessionFolder === null ? null : actualSessionFolder.id
          done()
        }

        getSeshyFolder(createSessionBookmarksFolderThenBookmarks)
      })

      afterEach(function (done) {
        cleanUp(done)
      })

      it('Should recognise when a set of opened tabs represents an existing session.', function () {
        expect(this.expectedSessionFolderId).toEqual(this.actualSessionFolderId)
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
