chrome.tabs.query({}, navigateToSpecRunner);

function navigateToSpecRunner(tabs) {
  tab = tabs[0];
  var specRunnerUrl = 'chrome-extension://kjcgkjibdcoobdfbchgokmfajekdgoee/spec-runner.html';

  updateInfo = {
    'url': specRunnerUrl
  }
  chrome.tabs.update(tab.id, updateInfo);
}
