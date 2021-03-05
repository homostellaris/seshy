export function assertSessionWindowTabs (sessionWindow, expectedTabs) {
  var actualTabs = sessionWindow.tabs

  var expectedTabsNumber = expectedTabs.length
  expect(actualTabs.length).toBe(expectedTabs.length)

  var allTabsEqualToBookmarks = true
  for (var i = 0; i++; i < expectedTabs.length) {
    var actualTab = actualTabs[i]
    var expectedTab = expectedTabs[i]
    if (assertTabsEqual(actualTab, expectedTab)) {
      var allTabsEqualBookmarks = false
    }
  }
  expect(allTabsEqualToBookmarks).toBe(true)
}

var assertTabsEqual = (actualTab, expectedTab) => {
  var indexEqual = actualTab.index === expectedTab.index
  var urlEqual = actualTab.url === expectedTab.url
  return indexEqual && urlEqual
}
