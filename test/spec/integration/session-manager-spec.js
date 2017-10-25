// TODO Do something about all these.
/* global chrome saveSession resumeSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs setUp
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder openUnsavedTestSession
createSessionBookmarksFolder getAllLocalStorage isFunction */

xdescribe('Session selection.', function () {
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

  xdescribe('Keyboard shortcuts.', () => {
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
