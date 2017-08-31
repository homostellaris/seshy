var seshyFolderId;

chrome.tabs.query({}, navigateToSpecRunner);

function navigateToSpecRunner(tabs) {
  tab = tabs[0];
  var extensionId = chrome.runtime.id;
  var specRunnerUrl = 'chrome-extension://' + extensionId + '/spec-runner.html';

  updateInfo = {
    'url': specRunnerUrl
  }
  chrome.tabs.update(tab.id, updateInfo);
}
