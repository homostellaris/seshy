/* global chrome */
var openNewTabThenExitBrowserActionPopup = (url) => {
  var createProperties = {url}
  chrome.tabs.create(createProperties)
  window.close()
}

var showKeyboardShortcuts = () => {
  window.location.href = 'keyboard-shortcuts.html'
}

var submitAFeatureRequest = () => {
  openNewTabThenExitBrowserActionPopup('https://github.com/moderatemisbehaviour/seshy/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement')
}

var reportABug = () => {
  openNewTabThenExitBrowserActionPopup('https://github.com/moderatemisbehaviour/seshy/issues?q=is%3Aopen+is%3Aissue+label%3Abug')
}

var seeOpenSourceCredits = () => {
  alert('Not yet implemented')
}

var setUp = () => {
  var showKeyboardShortcutsElement = document.getElementById('show-keyboard-shortcuts')
  var submitAFeatureRequestElement = document.getElementById('submit-a-feature-request')
  var reportABugElement = document.getElementById('report-a-bug')
  var seeOpenSourceCreditsElement = document.getElementById('see-open-source-credits')

  showKeyboardShortcutsElement.addEventListener('click', showKeyboardShortcuts)
  submitAFeatureRequestElement.addEventListener('click', submitAFeatureRequest)
  reportABugElement.addEventListener('click', reportABug)
  seeOpenSourceCreditsElement.addEventListener('click', seeOpenSourceCredits)
}

setUp()
