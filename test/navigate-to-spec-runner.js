/* global chrome */

var seshyFolderId

chrome.tabs.query({}, navigateToSpecRunner)

function navigateToSpecRunner (tabs) {
  var tab = tabs[0]
  var extensionId = chrome.runtime.id
  var specRunnerUrl = 'chrome-extension://' + extensionId + '/spec-runner.html'

  var updateInfo = {
    'url': specRunnerUrl
  }
  chrome.tabs.update(tab.id, updateInfo)
}
