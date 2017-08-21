var travisReporter = {

  failedExpectations: [],

  specDone: function (result) {
    this.failedExpectations.push(result.failedExpectations)
  },

  jasmineDone: function (results) {
    var jsonSpecResults = {
      failedExpectations: this.failedExpectations.length
    }
    document.body.innerHTML = JSON.stringify(jsonSpecResults)
  }

}

function passTravisJob() {
  exitChromeStatusCodeZero()
}

function failTravisJob () {
  exitChromeStatusCodeOne()
}

function exitChromeStatusCodeZero() {
  chrome.windows.getAll(null, closeAllWindows)
}

function exitChromeStatusCodeOne() {
  // createProperties = {
  //   'url': 'chrome://crash'
  // }
  // chrome.windows.create(createProperties)
  // window.location = 'chrome://crash'
  chrome.downloads.download({url: 'chrome-extension://mnfnmomoaeemcnofipofcmnlgimnoinn/spec-runner.html'})
}

function closeAllWindows(windows) {
  for (var i = 0; i < windows.length; i++) {
    var aWindow = windows[i]
    chrome.windows.remove(aWindow.id)
  }
}

jasmine.getEnv().addReporter(travisReporter)
