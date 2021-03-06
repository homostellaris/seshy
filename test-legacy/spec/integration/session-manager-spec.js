/* global chrome */

xdescribe('Session manager.', function () {
  function navigateToSessionManager (callback) {
    var extensionId = chrome.runtime.id
    this.specRunnerUrl = 'chrome-extension://' + extensionId + '/html/session-manager.html'
    var createData = {url: this.specRunnerUrl}
    chrome.windows.create(createData, callback)
  }

  describe('The toolbar.', function () {
    describe('The more information button.', function () {
      it('Navigates to the more information page.', function (done) {
        var clickMoreInformationLink = (sessionManagerWindow) => {
          var currentUrl = sessionManagerWindow.tabs[0].url
          expect(this.currentUrl).toEqual(this.specRunnerUrl)
          var moreInformationLink = sessionManagerWindow.getElementById('more-information-link')
          moreInformationLink.click()
          assertUrl()
        }

        var assertUrl = () => {
          // expect(window.location.href).toEqual('something')
          done()
        }

        navigateToSessionManager(clickMoreInformationLink)
      })

      afterEach(function (done) {
        this.testDataCreator.cleanUp(done)
      })
    })
  })
})
