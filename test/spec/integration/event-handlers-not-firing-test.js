/* global chrome saveSession goToSession tabEqualToBookmark getSession getTabsOrBookmarksInfo createTabs setUp
removeWindowToSessionFolderMapping deleteSession saveTestSession cleanUp getSeshyFolder openUnsavedTestSession
createSessionBookmarksFolder getAllLocalStorage isFunction */

describe('Event handler not firing.', function () {
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
      // var bar = document.getElementById('currently-open-sessions')
      // var foo = document.createElement('input')
      // bar.appendChild(foo)
      // foo.addEventListener('focus', () => {
      //   console.log('ADDING CLASS')
      //   foo.classList.add('selected')
      // })
      // foo.focus()
      // this.foo = foo
      if (isFunction(callback)) callback()
    }

    var openThreeUnsavedTestSessions = () => {
      chrome.windows.create({}, () => {
        // createSessionManagerDom(() => {
        //   setUp(() => {
        //     setTimeout(done, 1000)
        //   })
        // })
      })
      createSessionManagerDom(() => {
        setUp(() => {
          setTimeout(done, 1000)
        })
      })
      // for (var i = 0; i < 3; i++) {
      //   openUnsavedTestSession((newWindowId) => {
      //     console.log(`Window ${i} callback.`)
      //     this.windowIds.push(newWindowId)
      //     this.tabsInfo = getTabsOrBookmarksInfo(this.windowId)
      //     if (this.windowIds.length === 3) {
      //       console.log(`All windows called back, creating DOM.`)
      //       createSessionManagerDom(() => {
      //         setUp(() => {
      //           setTimeout(done, 1000)
      //         })
      //       })
      //     }
      //   })
      // }
      // createSessionManagerDom(() => {
      //   setUp(() => {
      //     setTimeout(done, 1000)
      //   })
      // })
    }

    // TODO Get rid of this setTimeout to wait for Seshy bookmarks folder to be created when running this test by itself.
    openThreeUnsavedTestSessions()
  })

  afterAll(function (done) {
    cleanUp(done)
    console.log('FINISHED!')
  })

  xit('Test event handler not fired.', function () {
    console.log('ASSERTING')
    expect(this.foo.classList.contains('selected')).toBe(true)
  })

  it('Only ever assigns one session card the \'selected\' class.', function () {
    console.log('ASSERTING')
    let currentlyOpenSession = this.container.getElementsByClassName('selected')
    expect(currentlyOpenSession.length).toBe(1)
  })
})
