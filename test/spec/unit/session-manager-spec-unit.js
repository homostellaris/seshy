describe('Session selection.', function () {
  xit('Focuses the currently open session when opened.', function () {
    // Not implemented.
  })

  xit('Assigns \'selected\' class to session with focus.', function () {
    // Not implemented.
  })

  xit('Only ever assigns one session card the \'selected\' class.', function () {
    let currentlyOpenSession = this.container.getElementsByClassName('selected')
    expect(currentlyOpenSession.length).toBe(1)
  })

  xit('Creates an orange border around the currently open session.', () => {
    // Not implemented.
  })

  describe('Keyboard shortcuts.', () => {
    describe('Selects the session above the currently selected one when the `UP` arrow key is pressed.', () => {
      xit('The `UP` arrow key calls `selectPreviousSession()`.', () => {
        // Not implemented.
      })

      describe('The `selectPreviousSession` function.', () => {
        it('Calls `focus` on the previous session if it is not null.', () => {
          var fakeSession = jasmine.createSpy('fakeSession')
          spyOn(window, 'getPreviousSession').and.returnValue(fakeSession)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectPreviousSession()

          expect(fakeSessionNameInput.focus).toHaveBeenCalled()
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
          var fakeSession = jasmine.createSpy('fakeSession')
          spyOn(window, 'getNextSession').and.returnValue(fakeSession)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectNextSession()

          expect(fakeSessionNameInput.focus).toHaveBeenCalled()
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
        it('Calls `focus` on the name input returned from `getSessionNameInput`.', () => {
          var fakePreviousSessionList = jasmine.createSpy('fakePreviousSessionList')
          spyOn(window, 'getPreviousSessionList').and.returnValue(fakePreviousSessionList)
          var fakeSessions = jasmine.createSpy('fakeSessions')
          spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectLastSessionInPreviousSessionList()

          expect(fakeSessionNameInput.focus).toHaveBeenCalled()
        })

        it('Calls `focus` on the name input of the last session in the previous session list.', () => {
          var fakePreviousSessionList = jasmine.createSpy('fakePreviousSessionList')
          spyOn(window, 'getPreviousSessionList').and.returnValue(fakePreviousSessionList)
          var fakeSessionOne = jasmine.createSpy('fakeSession')
          var fakeSessionTwo = jasmine.createSpy('fakeSession')
          var fakeSessionToBeFocused = jasmine.createSpy('fakeSessionToBeFocused')
          var fakeSessions = [fakeSessionOne, fakeSessionTwo, fakeSessionToBeFocused]
          spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectLastSessionInPreviousSessionList()

          expect(window.getSessionNameInput.calls.allArgs()).toEqual([[fakeSessionToBeFocused]])
        })
      })
    })

    describe('Selects the first session in the next section when the `RIGHT` arrow key is pressed.', () => {
      xit('The `RIGHT` arrow key calls `selectFirstSessionInNextSessionList()`.', () => {
        // Not implemented.
      })

      describe('The `selectFirstSessionInNextSessionList` function.', () => {
        it('Calls `focus` on the name input returned from `getSessionNameInput`.', () => {
          var fakeNextSessionList = jasmine.createSpy('fakeNextSessionList')
          spyOn(window, 'getNextSessionList').and.returnValue(fakeNextSessionList)
          var fakeSessions = jasmine.createSpy('fakeSessions')
          spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectFirstSessionInNextSessionList()

          expect(fakeSessionNameInput.focus).toHaveBeenCalled()
        })

        it('Calls `focus` on the name input of the first session in the next session list.', () => {
          var fakeNextSessionList = jasmine.createSpy('fakeNextSessionList')
          spyOn(window, 'getNextSessionList').and.returnValue(fakeNextSessionList)
          var fakeSessionTwo = jasmine.createSpy('fakeSession')
          var fakeSessionThree = jasmine.createSpy('fakeSession')
          var fakeSessionToBeFocused = jasmine.createSpy('fakeSessionToBeFocused')
          var fakeSessions = [fakeSessionToBeFocused, fakeSessionTwo, fakeSessionThree]
          spyOn(window, 'getSessionsFromSessionList').and.returnValue(fakeSessions)
          var fakeSessionNameInput = jasmine.createSpyObj('fakeSessionNameInput', ['focus'])
          spyOn(window, 'getSessionNameInput').and.returnValue(fakeSessionNameInput)

          selectFirstSessionInNextSessionList()

          expect(window.getSessionNameInput.calls.allArgs()).toEqual([[fakeSessionToBeFocused]])
        })
      })
    })
  })
})
