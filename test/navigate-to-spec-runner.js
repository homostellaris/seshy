/* global chrome */

/**
 * This is the background page for the test extension.
 * It ensures that as soon as the extension is loaded it navigates the open tab to the spec runner web page so that
 * the tests run.
 *
 * Initially this was attempted using the Chrome Driver script but this resulted in an error.
 */
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
