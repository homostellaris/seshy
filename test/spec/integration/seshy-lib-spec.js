// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder
createSessionBookmarksFolder getAllLocalStorage openUnsavedTestSession */

describe('Seshy lib', function () {
  describe('Saving sessions.', function () {
    beforeEach(function (done) {
      openUnsavedTestSession((newWindowId) => {
        this.windowId = newWindowId
        this.tabsInfo = getTabsOrBookmarksInfo(this.windowId)
        done()
      })
    })

    it('Should be able to save a set of tabs as bookmarks in a folder.', function (done) {
      callTest.call(this, done) // Rebinds `this` to Jasmine's context so that test variables can be passed around.
    })

    it('Should delete all the bookmarks in the session folder before saving an existing session.', function (done) {
      saveTestSession(this.windowId, () => {
        callTest.call(this, done)
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
      // This 'function expression' is not hoisted and so must be declared before is it referenced.
      // No hoisting is a bit sad but using a function expression allows us to use an arrow function which does not
      // rebind `this` and instead inherits `this` from its bounding scope which is useful for passing Jasmine's context.
      var getBookmarksFolder = () => {
        var query = {
          'title': 'Test Session'
        }
        chrome.bookmarks.search(query, getBookmarks)
      }

      var getBookmarks = (bookmarkSessionFolderSearchResults) => {
        // Only one bookmark session folder with the correct saved tabs ensures that the original bookmarks were deleted.
        expect(bookmarkSessionFolderSearchResults.length).toEqual(1)

        chrome.bookmarks.getChildren(bookmarkSessionFolderSearchResults[0].id, (bookmarkTreeNodes) => {
          this.bookmarks = bookmarkTreeNodes
          assertSavedBookmarks(this.bookmarks, this.tabsInfo)
        })
      }

      saveSession(this.windowId) // Method under test.
      setTimeout(getBookmarksFolder, 1000)

      // This function does not access `this` and so can be a 'function declaration' and benefit from 'hoisting'.
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
