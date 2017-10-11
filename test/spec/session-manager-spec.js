// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs setUp
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder openUnsavedTestSession
createSessionBookmarksFolder getAllLocalStorage */

describe('Session selection.', function () {
  beforeEach(function (done) {
    // TODO Get rid of this setTimeout to wait for Seshy bookmarks folder to be created when running this test by itself.
    this.windowIds = []
    setTimeout(() => {
      for (var i = 0; i < 3; i++) {
        openUnsavedTestSession((newWindowId) => {
          this.windowIds.push(newWindowId)
          this.tabsInfo = getTabsOrBookmarksInfo(this.windowId)
        })
        if (i === 2) {
          setUp()
          setTimeout(done, 1000)
        }
      }
    }, 1000)

    var container = document.getElementById('test-container')
    container.innerHTML = `
      <ul id="currently-open-sessions">
        <li class="session-card"></li>
        <li class="session-card"></li>
        <li class="session-card"></li>
      </ul>
      <ul id="saved-sessions">
        <li class="session-card"></li>
        <li class="session-card"></li>
        <li class="session-card"></li>
      </ul>
    `
    this.currentlyOpenSession = container.getElementsByClassName('session-card')[1]

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

    spyOn(chrome.windows, 'getCurrent').and.callFake(fakeGetCurrentWindow)
    // spyOn(window, 'getAllOpenWindows').and.callFake(fakeGetAllOpenWindows)
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
