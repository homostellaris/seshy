// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder getAllSessionFolders
createSessionBookmarksFolder getAllLocalStorage openUnsavedTestSession getSessionFolderBookmarks
assertSessionWindowTabs createAndSaveTestSession setUp resetTestContainer isFunction openThreeUnsavedTestSessions
deleteSelectedSession createAndSaveThreeTestSessions addKeyboardShortcuts saveSelectedSession
getCurrentlyOpenSessionElements storeWindowToSessionFolderMapping asyncLoop resumeSelectedSession removeWindow
renameSelectedSession renameSession editSession finishRenamingSelectedSession */
describe('Integration tests.', function () {
  beforeAll(function (done) {
    console.log('Waiting for seshyFolder variable to be populated.')
    setTimeout(done, 500) // Wait for initialise() to create Seshy folder.
  })

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
    describe('Saves open sessions as they are updated.', function () {
      beforeEach(function (done) {
        createAndSaveTestSession((session) => {
          this.session = session
          done()
        })
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

      it('Saves a set of tabs as bookmarks in a folder.', function (done) {
        this.session.updateBookmarkFolder((updatedBookmarkFolder) => {
          assertBookmarks(1, this.session.bookmarkFolder.children)
          done()
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
          }, 1000)
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
    })

    describe('Saving of \'saved\' sessions when their window is closed.', function () {
      beforeEach(function (done) {
        createAndSaveTestSession((session) => {
          this.session = session
          done()
        })
      })

      it('Saves the session again when a tab is added.', function (done) {
        var sessionWindowId = this.session.window.id

        var closeWindow = () => {
          chrome.windows.remove(this.session.window.id, () => {
            // Give event listener time to remove window-to-session-folder-mapping so that session correctly appears in
            // unsaved session list.
            setTimeout(resetSessionManager, 1000)
          })
        }

        var resetSessionManager = () => {
          resetTestContainer()
          setUp(() => {
            var savedSessionsList = document.getElementById('saved-sessions')
            var savedSessionElements = savedSessionsList.getElementsByClassName('session-card')
            expect(savedSessionElements.length).toEqual(1)
            this.sessionElement = savedSessionElements[0]
            // TODO call `resumeSelectedSession` session instead.
            resumeSession(this.sessionElement.seshySession, assertTabs)
          })
        }

        var assertTabs = () => {
          var sessionWindow = chrome.windows.getAll({populate: true}, (windows) => {
            var resumedSessionWindow = windows[1]
            expect(resumedSessionWindow.tabs.length).toEqual(5)
            expect(resumedSessionWindow.tabs[4].url).toEqual(this.expectedUrl)
            done()
          })
        }

        this.expectedUrl = 'chrome://history/syncedTabs'
        var createProperties = {
          windowId: sessionWindowId,
          url: this.expectedUrl
        }
        chrome.tabs.create(createProperties, () => {
          setTimeout(closeWindow, 2000)
        })
      })

      xit('Saves the session again when a tab\'s URL is changed.', function () {
        console.log('Unimplemented test.')
      })

      xit('Saves the session again when a tab is removed.', function () {
        console.log('Unimplemented test.')
      })

      xit('Saves the session again when a tab is moved.', function () {
        console.log('Unimplemented test.')
      })
    })

    describe('Representation of saved state.', function () {
      describe('Browser action icon.', function () {
        beforeEach(function (done) {
          var captureSession = (session) => {
            this.session = session
            done()
          }

          openUnsavedTestSession(captureSession)
        })

        it('Is an \'bookmark border\' icon when the currently focused session is unsaved.', function (done) {
          var assertBrowserActionIconSetToUnsavedState = () => {
            expect(window.setBrowserActionIconToUnsaved).toHaveBeenCalled()
            // TODO Assert icon is changed back to idle.
            done()
          }

          spyOn(window, 'setBrowserActionIconToUnsaved').and.callThrough()
          setTimeout(assertBrowserActionIconSetToUnsavedState, 1000)
        })

        it('Is a \'sync\' icon whilst a session save is pending.', function (done) {
          var assertBrowserActionIconSetToSavingState = () => {
            expect(window.setBrowserActionIconToSaving).toHaveBeenCalled()
            // TODO Assert icon is changed back to idle.
            done()
          }

          spyOn(window, 'setBrowserActionIconToSaving').and.callThrough()
          this.session.element.focus()
          saveSelectedSession(() => {
            setTimeout(assertBrowserActionIconSetToSavingState, 1000)
          })
        })

        it('Is a \'bookmark\' icon when the currently focused session is saved.', function (done) {
          var assertBrowserActionIconSetToSavedState = () => {
            expect(window.setBrowserActionIconToSaved).toHaveBeenCalled()
            // TODO Assert icon is changed back to idle.
            done()
          }

          spyOn(window, 'setBrowserActionIconToSaved').and.callThrough()
          this.session.element.focus()
          saveSelectedSession(() => {
            setTimeout(assertBrowserActionIconSetToSavedState, 2000)
          })
        })
      })

      describe('Session cards in the session manager.', function () {
        beforeEach(function (done) {
          var saveTestSessionAndCaptureSession = (session) => {
            this.session = session
            done()
          }
          openUnsavedTestSession(saveTestSessionAndCaptureSession)
        })

        it('Displays a bookmark icon on the session card when it is saved.', function (done) {
          var sessionStateIcon = this.session.element.getElementsByClassName('saved-state-icon')[0]
          expect(sessionStateIcon.textContent).toBe('bookmark_border')

          document.getElementsByClassName('session-card')[0].focus()
          saveSelectedSession(() => {
            expect(sessionStateIcon.textContent).toBe('bookmark')
            done()
          })
        })
      })
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })

  describe('Resuming sessions.', function () {
    var assertSessionWindowFocused = (sessionWindow) => {
      expect(chrome.windows.update.calls.count()).toBe(1)
      var actualArgs = chrome.windows.update.calls.argsFor(0)
      expect(actualArgs).toContain(sessionWindow.id)
      expect(actualArgs).toContain({'focused': true})
    }

    var assertGoneToSession = (session, callback) => {
      assertSessionWindowFocused(session.window)
      var expectedTabs = getTabsOrBookmarksInfo(session.window.id)
      assertSessionWindowTabs(session.window, expectedTabs)
      callback()
    }

    beforeEach(function () {
      // The spy is needed to verify that the window is focused.
      // For some reason the testing of focusing other windows does not work in the spec runner.
      // The window gains focus but the spec runner gains focus before the next line in the spec file can assert that
      // the window is focused.
      // Happy to settle for verification that the chrome API is called in this instance.
      spyOn(chrome.windows, 'update').and.callThrough()
    })

    describe('User resumes a session from the session manager.', function () {
      beforeEach(function (done) {
        createAndSaveTestSession((session) => {
          this.session = session
          done()
        })
      })

      it('Resumes an unshelved session that is already focused by exiting the session manager.', function (done) {
        resumeSession(this.session, () => {
          assertGoneToSession(this.session, done)
        })
      })

      it('Resumes an unshelved session that is not already focused by focusing it.', function (done) {
        createAndSaveTestSession((session) => {
          this.sessionTwo = session
          resumeSession(this.session, () => {
            assertGoneToSession(this.session, done)
          })
        })
      })

      it('Resumes a shelved session by creating a window with session\'s tabs and focusing it.', function (done) {
        var resumeSessionThenAssert = () => {
          resumeSession(this.session, () => {
            assertGoneToSession(this.session, done)
          })
        }

        var removeWindowThenResumeSession = () => {
          chrome.windows.remove(this.session.window.id, resumeSessionThenAssert)
        }

        createAndSaveTestSession(resumeSessionThenAssert)
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
    var assertSessionDeleted = (session, callback) => {
      var assertSessionElementRemoved = (session, callback) => {
        var sessionElements = document.getElementsByClassName('session-card')
        var sessionElementRemoved = true

        for (var i = 0; i < sessionElements.length; i++) {
          var sessionElement = sessionElements[i]
          if (sessionElement === session.element) {
            sessionElementRemoved = false
          }
        }

        expect(sessionElementRemoved).toBe(true)
        callback()
      }

      var tryGetSessionFolder = () => {
        if (session.bookmarkFolder && session.bookmarkFolder.id) {
          chrome.bookmarks.get(session.bookmarkFolder.id.toString(), assertBookmarkFolderDeleted)
        } else {
          callback()
        }
      }

      var assertBookmarkFolderDeleted = (bookmarkFolderId) => {
        var sessionFolderDeleted = false
        if (chrome.runtime.lastError) {
          sessionFolderDeleted = true
        }
        expect(sessionFolderDeleted).toBe(true)
        callback()
      }

      assertSessionElementRemoved(session, tryGetSessionFolder)
    }

    describe('Unsaved sessions.', function () {
      beforeEach(function (done) {
        openUnsavedTestSession((session) => {
          this.session = session
          done()
        })
      })

      it('Deletes an unsaved session by removing its window.', function (done) {
        deleteSession(this.session, () => {
          assertSessionDeleted(this.session, done)
        })
      })
    })

    describe('Saved sessions.', function () {
      beforeEach(function (done) {
        createAndSaveTestSession((session) => {
          this.session = session
          done()
        })
      })

      it('Deletes a shelved session by removing its bookmark folder.', function (done) {
        var assertSessionDeletedThenDone = () => {
          assertSessionDeleted(this.session, done)
        }

        chrome.windows.remove(this.session.window.id, () => {
          this.session.window = null
          deleteSession(this.session, assertSessionDeletedThenDone)
        })
      })

      it('Deletes an unshelved session by removing its window and bookmark folder.', function (done) {
        var assertSessionDeletedThenDone = () => {
          assertSessionDeleted(this.session, done)
        }

        deleteSession(this.session, assertSessionDeletedThenDone)
      })
    })

    describe('Deleting a session with keyboard shortcuts.', function () {
      beforeEach(function (done) {
        openThreeUnsavedTestSessions((sessions) => {
          this.sessions = sessions
          this.sessionElements = document.getElementsByClassName('session-card')
          this.secondSessionElement = this.sessionElements[1]
          this.thirdSessionElement = this.sessionElements[2]
          this.secondSessionElement.focus()
          this.secondSessionElement.classList.add('selected')
          done()
        })
      })

      it('Selects the next session.', function (done) {
        var assertSelectedSession = () => {
          var selectedSession = document.activeElement
          expect(selectedSession).toEqual(this.thirdSessionElement)
          done()
        }

        deleteSelectedSession(assertSelectedSession)
      })
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })

  describe('Browsing sessions.', function () {
    describe('Currently open sessions.', function () {
      beforeEach(function (done) {
        this.windows = []

        var createWindow = (uselessNumber, callback) => {
          chrome.windows.create(null, (aWindow) => {
            this.windows.push(aWindow)
            callback()
          })
        }

        var createSavedSecondSession = () => {
          getSeshyFolder((seshyFolder) => {
            createSessionBookmarksFolder(seshyFolder, storeWindowToBookmarkFolderMapping)
          })
        }

        var storeWindowToBookmarkFolderMapping = (bookmarkFolder) => {
          storeWindowToSessionFolderMapping(this.windows[0].id, bookmarkFolder.id, initialiseSessionManager)
        }

        var initialiseSessionManager = () => {
          setUp(done)
        }

        asyncLoop([1, 2], createWindow, createSavedSecondSession)
      })

      it('Shows the name of currently open saved sessions.', function (done) {
        var assertSessionNameShown = () => {
          var currentlyOpenSessions = getCurrentlyOpenSessionElements()
          expect(currentlyOpenSessions.length).toBe(3) // Includes spec runner window.

          var expectedSessionNames = ['Unsaved Session', 'Test Session', 'Unsaved Session']

          for (var i = 0; i < currentlyOpenSessions.length; i++) {
            var savedSession = currentlyOpenSessions[i]
            var sessionNameInput = savedSession.getElementsByClassName('session-name-input')[0]
            var expectedText = expectedSessionNames[i]
            var actualText = sessionNameInput.value
            expect(actualText).toEqual(expectedText)
          }

          done()
        }

        setTimeout(assertSessionNameShown, 500)
      })

      it('Shows sessions in the order they were opened.', function (done) {
        var assertSessionsOrder = () => {
          var currentlyOpenSessionElements = getCurrentlyOpenSessionElements()

          var expectedWindowIdsInOrder = []
          for (let i = 0; i < currentlyOpenSessionElements.length; i++) {
            let windowId = currentlyOpenSessionElements[i].seshySession.window.id
            expectedWindowIdsInOrder.push(windowId)
          }

          var actualWindowIdsInOrder = []
          for (let i = 0; i < currentlyOpenSessionElements.length; i++) {
            let windowId = currentlyOpenSessionElements[i].seshySession.window.id
            actualWindowIdsInOrder.push(windowId)
          }

          expect(expectedWindowIdsInOrder).toEqual(actualWindowIdsInOrder)
          done()
        }

        assertSessionsOrder()
      })

      afterEach(function (done) {
        cleanUp(done)
      })
    })

    describe('Shelved sessions.', function () {
      beforeEach(function (done) {
        var callSetupThenDone = () => {
          setUp(done)
        }
        createAndSaveTestSession((session) => {
          resetTestContainer()
          chrome.storage.local.remove(session.window.id.toString(), callSetupThenDone)
        })
      })

      it('Shows the number of tabs in the session.', function (done) {
        var assertNumberOfTabsShown = () => {
          var expectedText = '4 tabs'
          var shelvedSessionsList = document.getElementById('saved-sessions')
          var shelvedSessions = shelvedSessionsList.getElementsByClassName('session-card')
          expect(shelvedSessions.length).toBe(1)
          var shelvedSession = shelvedSessions[0]
          var numberOfTabsSpan = shelvedSession.getElementsByClassName('tabs-number')[0]
          var actualText = numberOfTabsSpan.textContent.trim()
          expect(actualText).toEqual(expectedText)
          done()
        }
        setTimeout(assertNumberOfTabsShown, 500)
      })

      it('Shows all sessions in the \'Shelved Sessions\' list with a bookmark icon ' +
      '(because all \'shelved\' sessions are by definition also \'saved\' sessions.)', function (done) {
        var expectedIconName = 'bookmark'

        var assertBookmarkIconOnPatientCard = () => {
          var shelvedSessionsList = document.getElementById('saved-sessions')
          var shelvedSessions = shelvedSessionsList.getElementsByClassName('session-card')
          expect(shelvedSessions.length).toBe(1)
          var shelvedSession = shelvedSessions[0]
          var savedStateIcon = shelvedSession.getElementsByClassName('saved-state-icon')[0]
          var actualIconName = savedStateIcon.textContent

          expect(actualIconName).toEqual(expectedIconName)
          done()
        }
        // TODO Find out why a setTimeout is necessary here. Style should be applied before `setUp` callsback.
        setTimeout(assertBookmarkIconOnPatientCard, 500)
      })

      it('Shows the name of shelved sessions.', function (done) {
        var assertSessionNameShown = () => {
          var expectedText = 'Test Session'
          var shelvedSessionList = document.getElementById('saved-sessions')
          var shelvedSessions = shelvedSessionList.getElementsByClassName('session-card')
          expect(shelvedSessions.length).toBe(1)
          var shelvedSession = shelvedSessions[0]
          var sessionNameInput = shelvedSession.getElementsByClassName('session-name-input')[0]
          var actualText = sessionNameInput.value
          expect(actualText).toEqual(expectedText)
          done()
        }
        setTimeout(assertSessionNameShown, 500)
      })

      afterEach(function (done) {
        cleanUp(done)
      })
    })

    xdescribe('Selecting sessions.', function () {
      beforeAll(function (done) {
        this.windowIds = []

        var createSessionManagerDom = (callback) => {
          this.container = document.getElementById('test-container')
          this.container.innerHTML = `
            <ul id="currently-open-sessions">
            </ul>
            <ul id="saved-sessions">
            </ul>
          `
          if (isFunction(callback)) callback()
        }

        var openThreeUnsavedTestSessions = () => {
          for (var i = 0; i < 3; i++) {
            openUnsavedTestSession((newWindowId) => {
              this.windowIds.push(newWindowId)
              this.tabsInfo = getTabsOrBookmarksInfo(this.windowId)
              if (this.windowIds.length === 3) {
                createSessionManagerDom(() => {
                  setUp(() => {
                    setTimeout(done, 1000)
                  })
                })
              }
            })
          }
        }

        // TODO Get rid of this setTimeout to wait for Seshy bookmarks folder to be created when running this test by itself.
        openThreeUnsavedTestSessions()
      })

      afterAll(function (done) {
        cleanUp(done)
        console.log('FINISHED!')
      })

      it('Focuses the currently open session when opened.', function () {
        console.log('Asserting focused.')
        // Currently open session will be the last opened window and therefore the last one in the list.
        let currentlyOpenSession = this.container.getElementsByClassName('session-card')[3]
        let currentlyOpenSessionNameInput = currentlyOpenSession.getElementsByClassName('session-name-input')[0]
        expect(currentlyOpenSessionNameInput).toBe(document.activeElement)
      })

      it('Assigns \'selected\' class to session with focus.', function () {
        console.log('Asserting selected.')
        // Currently open session will be the last opened window and therefore the last one in the list.
        let currentlyOpenSession = this.container.getElementsByClassName('session-card')[3]
        expect(currentlyOpenSession.classList.contains('selected')).toBe(true)
      })

      it('Only ever assigns one session card the \'selected\' class.', function () {
        let currentlyOpenSession = this.container.getElementsByClassName('selected')
        expect(currentlyOpenSession.length).toBe(1)
      })

      xit('Creates an orange border around the currently open session.', () => {
        // Not implemented.
      })
    })

    describe('Browser action icon.', function () {
      xit('Shows a tooltip on mouseover that provides information about the session for the current window.',
        function () {
          console.log('Unimplemented test.')
        })
    })
  })

  describe('Renaming sessions.', function () {
    beforeEach(function (done) {
      createAndSaveThreeTestSessions((sessions) => {
        this.sessions = sessions
        this.secondSession = this.sessions[1]
        this.secondSessionEditIcon = this.secondSession.element.getElementsByClassName('edit-icon')[0]
        addKeyboardShortcuts()
        this.secondSession.element.focus()
        done()
      })
    })

    it('Starts the renaming when the \'edit\' icon is clicked by focusing the session name input...', function (done) {
      expect(document.activeElement).toEqual(this.secondSession.element)
      editSession.call(this.secondSessionEditIcon, () => {
        var secondSessionNameInput = this.secondSession.element.getElementsByClassName('session-name-input')[0]
        expect(document.activeElement).toEqual(secondSessionNameInput)
        done()
      })
    })

    xit('...Or alternatively when the `r` button is pressed.', function (done) {
      console.log('Unimplemented test.')
      done()
    })

    it('Changes the \'edit\' button to a \'done\' button once the renaming has started.', function (done) {
      expect(this.secondSessionEditIcon.textContent).toEqual('edit')
      editSession.call(this.secondSessionEditIcon, () => {
        expect(this.secondSessionEditIcon.textContent).toEqual('done')
        done()
      })
    })

    it('Saves the renaming when the \'done\' icon is clicked...', function (done) {
      var saveRenamingThenAssert = () => {
        secondSessionNameInput.value = 'Renamed Session'
        finishRenamingSelectedSession(() => {
          assertSessionRenamed(this.secondSession, 'Renamed Session', done)
        })
      }

      var assertSessionRenamed = (session, expectedName, callback) => {
        session.updateBookmarkFolder(() => {
          expect(session.bookmarkFolder.title).toEqual(expectedName)
          expect(secondSessionNameInput.value).toEqual(expectedName)
          callback()
        })
      }

      var secondSessionNameInput = this.secondSession.element.getElementsByClassName('session-name-input')[0]
      editSession.call(this.secondSessionEditIcon, saveRenamingThenAssert)
    })

    xit('...Or alternatively when the `ENTER` key is pressed.', function (done) {
      console.log('Unimplemented test.')
    })

    xit('Restores the session name to its original value if the session name input loses focus before confirming the ' +
    'renaming.', function (done) {
      console.log('Unimplemented test.')
      done()
    })

    xit('Saves the session if was not already saved.', function (done) {
      console.log('Unimplemented test.')
      done()
    })

    xit('Disables the keyboard shortcuts whilst renaming.', function (done) {
      console.log('Unimplemented test.')
      done()
    })

    afterEach(function (done) {
      cleanUp(done)
    })
  })
})
