/* global setUp selectPreviousSession selectNextSession selectLastSessionInPreviousSessionList
selectFirstSessionInNextSessionList resumeSelectedSession saveSelectedSession focusSessionNameInput */

describe('Unit tests.', function () {
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
        expect(window.focusCurrentlyOpenSession).toHaveBeenCalled()
        done()
      }
      spyOn(window, 'focusCurrentlyOpenSession').and.callThrough()

      setUp(assertCalled)
    })
  })

  describe('Keyboard shortcuts.', function () {
    describe('Selecting sessions.', function () {
      describe('Selects the session above the currently selected one when the `UP` arrow key is pressed.', () => {
        xit('The `UP` arrow key calls `selectPreviousSession()`.', () => {
          // Not implemented.
        })

        describe('The `selectPreviousSession` function.', () => {
          it('Calls `focus` on the previous session if it is not null.', () => {
            var fakeSession = jasmine.createSpyObj('fakeSession', ['focus'])
            spyOn(window, 'getPreviousSession').and.returnValue(fakeSession)

            selectPreviousSession()

            expect(fakeSession.focus).toHaveBeenCalled()
          })

          it('Calls `selectLastSessionInPreviousSessionList` if the previous session is null.', () => {
            spyOn(window, 'getPreviousSession').and.returnValue(null)
            spyOn(window, 'selectLastSessionInPreviousSessionList')

            selectPreviousSession()

            expect(window.selectLastSessionInPreviousSessionList).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the session below the currently selected one when the `DOWN` arrow key is pressed.', () => {
        xit('The `DOWN` arrow key calls `selectPreviousSession()`.', () => {
          // Not implemented.
        })

        describe('The `selectNextSession` function.', () => {
          it('Calls `focus` on the next session if it is not null.', () => {
            var fakeSession = jasmine.createSpyObj('fakeSession', ['focus'])
            spyOn(window, 'getNextSession').and.returnValue(fakeSession)

            selectNextSession()

            expect(fakeSession.focus).toHaveBeenCalled()
          })

          it('Calls `selectFirstSessionInNextSessionList` if the previous session is null.', () => {
            spyOn(window, 'getNextSession').and.returnValue(null)
            spyOn(window, 'selectFirstSessionInNextSessionList')

            selectNextSession()

            expect(window.selectFirstSessionInNextSessionList).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the last session in the previous section when the `LEFT` arrow key is pressed.', () => {
        xit('The `LEFT` arrow key calls `selectLastSessionInPreviousSessionList()`.', () => {
          // Not implemented.
        })

        describe('The `selectLastSessionInPreviousSessionList` function.', () => {
          it('Calls `focus` on the last session returned from `getSessionsFromSessionList`.', () => {
            var fakePreviousSessionList = jasmine.createSpy('fakePreviousSessionList')
            spyOn(window, 'getPreviousSessionList').and.returnValue(fakePreviousSessionList)
            var lastFakeSessionInList = jasmine.createSpyObj('lastFakeSessionInList', ['focus'])
            var fakeSessions = [
              jasmine.createSpy('firstFakeSessionInList'),
              jasmine.createSpy('middleFakeSessionInList'),
              lastFakeSessionInList
            ]
            spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)

            selectLastSessionInPreviousSessionList()

            expect(lastFakeSessionInList.focus).toHaveBeenCalled()
          })
        })
      })

      describe('Selects the first session in the next section when the `RIGHT` arrow key is pressed.', () => {
        xit('The `RIGHT` arrow key calls `selectFirstSessionInNextSessionList()`.', () => {
          // Not implemented.
        })

        describe('The `selectFirstSessionInNextSessionList` function.', () => {
          it('Calls `focus` on the first session returned from `getSessionsFromSessionList`.', () => {
            var fakeNextSessionList = jasmine.createSpy('fakeNextSessionList')
            spyOn(window, 'getNextSessionList').and.returnValue(fakeNextSessionList)
            var firstFakeSessionInList = jasmine.createSpyObj('firstFakeSessionInList', ['focus'])
            var fakeSessions = [
              firstFakeSessionInList,
              jasmine.createSpy('firstFakeSessionInList'),
              jasmine.createSpy('firstFakeSessionInList')
            ]
            spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)

            selectFirstSessionInNextSessionList()

            expect(firstFakeSessionInList.focus).toHaveBeenCalled()
          })
        })
      })
    })

    describe('Goes to the selected session when the `ENTER` key is pressed.', function () {
      describe('The `resumeSelectedSession` function.', function () {
        xit('Calls `getSelectedSession` function.', function () {
          var fakeSessionElement = jasmine.createSpyObj('fakeSessionElement', ['seshySession'])
          spyOn(window, 'getSelectedSession').and.returnValue(fakeSessionElement)
          spyOn(window, 'resumeSelectedSession')

          resumeSelectedSession()

          expect(window.getSelectedSession).toHaveBeenCalled()
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
      describe('The `focusSessionNameInput` function.', function () {
        it('Calls select on the session name input.', function () {
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['select'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          var fakeEvent = jasmine.createSpy('fakeEvent')
          focusSessionNameInput(fakeEvent)

          expect(fakeSessionNameInput.select).toHaveBeenCalled()
        })
      })

      describe('Saves the session when the `ENTER` key is pressed during renaming.', function () {
        describe('The `saveSelectedSession` function.', function () {
          xit('Calls `getSelectedSession` function.', function () {
            var fakeSessionElement = jasmine.createSpyObj('fakeSessionElement', ['seshySession'])
            spyOn(window, 'getSelectedSession').and.returnValue(fakeSessionElement)
            var fakeSessionNameInput = jasmine.createSpy('fakeSessionNameInput')
            spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)
            spyOn(window, 'saveSession')

            saveSelectedSession()

            expect(window.getSelectedSession).toHaveBeenCalled()
          })
        })
      })

      describe('Arrow key navigation still works and cancels renaming.', function () {
        console.log('Unimplemented test.')
      })
    })
  })
})
