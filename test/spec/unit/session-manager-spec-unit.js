/* global setUp selectPreviousSession selectNextSession selectLastSessionInPreviousSessionList
selectFirstSessionInNextSessionList resumeSelectedSession saveSelectedSession focusSessionNameInput */

import { SessionManager } from '/js/session-manager.js'

describe('Unit tests.', function () {
  beforeAll(function () {
    this.sessionManager = new SessionManager()
  })

  describe('Session object.', function () {
    it('Throws an exception if an argument is not provided.', function () {
      console.log('Unimplemented test.')
      expect(1).toBe(1)
    })
  })

  describe('The `setUp` method.', function () {
    it('Calls the `focusCurrentlyOpenSession` method.', function (done) {
      // spyOn(window, 'addKeyboardShortcuts')
      // spyOn(window 'mdc')
      var assertCalled = () => {
        expect(this.sessionManager.focusCurrentlyOpenSession).toHaveBeenCalled()
        done()
      }
      spyOn(this.sessionManager, 'focusCurrentlyOpenSession').and.callThrough()

      this.sessionManager.setUp(assertCalled)
    })
  })

  describe('Keyboard shortcuts.', function () {
    describe('Selecting sessions.', function () {
      describe('Selects the session above the currently selected one when the `UP` arrow key is pressed.', function () {
        xit('The `UP` arrow key calls `selectPreviousSession()`.', function () {
          // Not implemented.
        })

        describe('The `selectPreviousSession` function.', function () {
          it('Calls `focus` on the previous session if it is not null.', function () {
            var fakeSession = jasmine.createSpyObj('fakeSession', ['focus'])
            console.log('SESSION MANAGER IS ' + this.sessionManager)
            spyOn(this.sessionManager, 'getPreviousSession').and.returnValue(fakeSession)

            this.sessionManager.selectPreviousSession()

            expect(fakeSession.focus).toHaveBeenCalled()
          })

          it('Calls `selectLastSessionInPreviousSessionList` if the previous session is null.', function () {
            spyOn(this.sessionManager, 'getPreviousSession').and.returnValue(null)
            spyOn(this.sessionManager, 'selectLastSessionInPreviousSessionList')

            this.sessionManager.selectPreviousSession()

            expect(this.sessionManager.selectLastSessionInPreviousSessionList).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the session below the currently selected one when the `DOWN` arrow key is pressed.', function () {
        xit('The `DOWN` arrow key calls `selectPreviousSession()`.', function () {
          // Not implemented.
        })

        describe('The `selectNextSession` function.', function () {
          it('Calls `focus` on the next session if it is not null.', function () {
            var fakeSession = jasmine.createSpyObj('fakeSession', ['focus'])
            spyOn(this.sessionManager, 'getNextSession').and.returnValue(fakeSession)

            this.sessionManager.selectNextSession()

            expect(fakeSession.focus).toHaveBeenCalled()
          })

          it('Calls `selectFirstSessionInNextSessionList` if the previous session is null.', function () {
            spyOn(this.sessionManager, 'getNextSession').and.returnValue(null)
            spyOn(this.sessionManager, 'selectFirstSessionInNextSessionList')

            this.sessionManager.selectNextSession()

            expect(this.sessionManager.selectFirstSessionInNextSessionList).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the last session in the previous section when the `LEFT` arrow key is pressed.', function () {
        xit('The `LEFT` arrow key calls `selectLastSessionInPreviousSessionList()`.', function () {
          // Not implemented.
        })

        describe('The `selectLastSessionInPreviousSessionList` function.', function () {
          it('Calls `focus` on the last session returned from `getSessionsFromSessionList`.', function () {
            var fakePreviousSessionList = jasmine.createSpy('fakePreviousSessionList')
            spyOn(this.sessionManager, 'getPreviousSessionList').and.returnValue(fakePreviousSessionList)
            var lastFakeSessionInList = jasmine.createSpyObj('lastFakeSessionInList', ['focus'])
            var fakeSessions = [
              jasmine.createSpy('firstFakeSessionInList'),
              jasmine.createSpy('middleFakeSessionInList'),
              lastFakeSessionInList
            ]
            spyOn(this.sessionManager, 'getSessionsFromSessionList').and.returnValue(fakeSessions)

            this.sessionManager.selectLastSessionInPreviousSessionList()

            expect(lastFakeSessionInList.focus).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the first session in the next section when the `RIGHT` arrow key is pressed.', function () {
        xit('The `RIGHT` arrow key calls `selectFirstSessionInNextSessionList()`.', function () {
          // Not implemented.
        })

        describe('The `selectFirstSessionInNextSessionList` function.', function () {
          it('Calls `focus` on the first session returned from `getSessionsFromSessionList`.', function () {
            var fakeNextSessionList = jasmine.createSpy('fakeNextSessionList')
            spyOn(this.sessionManager, 'getNextSessionList').and.returnValue(fakeNextSessionList)
            var firstFakeSessionInList = jasmine.createSpyObj('firstFakeSessionInList', ['focus'])
            var fakeSessions = [
              firstFakeSessionInList,
              jasmine.createSpy('firstFakeSessionInList'),
              jasmine.createSpy('firstFakeSessionInList')
            ]
            spyOn(this.sessionManager, 'getSessionsFromSessionList').and.returnValue(fakeSessions)

            this.sessionManager.selectFirstSessionInNextSessionList()

            expect(firstFakeSessionInList.focus).toHaveBeenCalled()
          })
        })
      })
    })

    describe('Goes to the selected session when the `ENTER` key is pressed.', function () {
      describe('The `resumeSelectedSession` function.', function () {
        xit('Calls `getSelectedSession` function.', function () {
          var fakeSessionElement = jasmine.createSpyObj('fakeSessionElement', ['seshySession'])
          spyOn(this.sessionManager, 'getSelectedSession').and.returnValue(fakeSessionElement)
          spyOn(this.sessionManager, 'resumeSelectedSession')

          this.sessionManager.resumeSelectedSession()

          expect(this.sessionManager.getSelectedSession).toHaveBeenCalled()
        })

        xit('Calls `closeSessionManager` if the session is focused.', function () {
          console.log('Unimplemented test.')
        })

        xit('Calls `resumeSession` if the session is shelved.', function () {
          console.log('Unimplemented test.')
        })

        xit('Calls `chrome.windows.update` with the `focused` property set to `true` if the session is unshelved.',
          function () {
            console.log('Unimplemented test.')
          })
      })
    })

    describe('Renames the session when the `r` key is pressed.', function () {
      describe('Saves the session when the `ENTER` key is pressed during renaming.', function () {
        describe('The `saveSelectedSession` function.', function () {
          xit('Calls `getSelectedSession` function.', function () {
            var fakeSessionElement = jasmine.createSpyObj('fakeSessionElement', ['seshySession'])
            spyOn(this.sessionManager, 'getSelectedSession').and.returnValue(fakeSessionElement)
            var fakeSessionNameInput = jasmine.createSpy('fakeSessionNameInput')
            spyOn(this.sessionManager, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)
            spyOn(this.sessionManager, 'saveSession')

            this.sessionManager.saveSelectedSession()

            expect(this.sessionManager.getSelectedSession).toHaveBeenCalled()
          })
        })
      })

      describe('Arrow key navigation still works and cancels renaming.', function () {
        console.log('Unimplemented test.')
      })
    })
  })
})
