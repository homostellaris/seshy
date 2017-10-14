// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs setUp
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder openUnsavedTestSession
createSessionBookmarksFolder getAllLocalStorage isFunction */

describe('Session selection.', function () {
  beforeEach(function (done) {
    this.windowIds = []

    var createSessionManagerDom = (callback) => {
      this.container = document.getElementById('test-container')
      this.container.innerHTML = `
        <ul id="currently-open-sessions">
        </ul>
        <ul id="saved-sessions">
        </ul>
      `
      isFunction(callback) && callback()
    }

    var openThreeUnsavedTestSessions = () => {
      for (var i = 0; i < 3; i++) {
        openUnsavedTestSession((newWindowId) => {
          this.windowIds.push(newWindowId)
          this.tabsInfo = getTabsOrBookmarksInfo(this.windowId)
        })
        if (i === 2) {
          createSessionManagerDom(() => {
            setUp(getCurrentlyOpenSessionAndCallDone)
          })
        }
      }
    }

    var getCurrentlyOpenSessionAndCallDone = () => {
      this.currentlyOpenSession = this.container.getElementsByClassName('session-card')[2]
      done()
    }

    var fakeGetCurrentWindow = (getInfo, callback) => {
      var fakeWindow = {id: this.windowIds[1]}
      callback(fakeWindow)
    }

    var fakeGetAllOpenWindows = (callback) => {
      var fakeWindows = [
        {
          id: 4,
          tabs: getTabsOrBookmarksInfo(4)
        },
        {
          id: 5,
          tabs: getTabsOrBookmarksInfo(5)
        },
        {
          id: 6,
          tabs: getTabsOrBookmarksInfo(6)
        }
      ]
      callback(fakeWindows)
    }

    // spyOn(chrome.windows, 'getCurrent').and.callFake(fakeGetCurrentWindow)
    // spyOn(window, 'getAllOpenWindows').and.callFake(fakeGetAllOpenWindows)

    // TODO Get rid of this setTimeout to wait for Seshy bookmarks folder to be created when running this test by itself.
    setTimeout(() => {
      openThreeUnsavedTestSessions()
    }, 1000)
  })

  afterEach(function (done) {
    cleanUp(done)
  })

  it('Selects the currently open session when opened.', function (done) {
    expect(this.currentlyOpenSession.classList.contains('selected')).toBe(true)
    done()
  })

  xit('Assigns \'selected\' class to session with focus.', function () {
    expect(this.savedSessions.classList.contains('selected')).toBe(true)
  })

  xit('Only ever assigns one session card the \'selected\' class.', function () {
    // Not implemented.
  })

  xit('Creates an orange border around the currently open session.', () => {
    // Not implemented.
  })

  xdescribe('Hotkeys.', () => {
    xit('Selects the session above the currently selected one when the `UP` arrow key is pressed.', () => {
      // Not implemented.
    })

    xit('Selects the session above the currently selected one when the `UP` arrow key is pressed.', () => {
      // Not implemented.
    })

    xit('Selects the session below the currently selected one when the `DOWN` arrow key is pressed.', () => {
      // Not implemented.
    })

    xit('Selects the last session in the previous section when the `LEFT` arrow key is pressed.', () => {
      // Not implemented.
    })

    xit('Selects the first session in the next section when the `RIGHT` arrow key is pressed.', () => {
      // Not implemented.
    })
  })
})
