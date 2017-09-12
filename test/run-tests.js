require('chromedriver')
const webdriver = require('selenium-webdriver'),
      chrome = require('selenium-webdriver/chrome'),
      By = webdriver.By,
      until = webdriver.until

var chromeOptions = new chrome.Options()
chromeOptions.addExtensions('output/test.crx')

var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .setChromeOptions(chromeOptions)
  .build()

// If the tests pass then jasmine-summary becomes visible.
// Otherwise jasmine-failures becomes visible.
driver.findElement(By.className('jasmine-results')).then((jasmineResults) => {
  driver.wait(until.elementIsVisible(jasmineResults))
  return driver.findElement(By.className('jasmine-summary'))
}).then((jasmineSummary) => {
  console.log('Waiting for jasmine-summary element to become visible.')
  return driver.wait(until.elementIsVisible(jasmineSummary), 1000)
}).then(() => {
  console.log('The jasmine-summary element became visible so there should be no failures.')
  pass()
}, (reason) => {
  getFailures()
})

function getFailures() {
  driver.findElement(By.className('jasmine-failures')).then((jasmineFailures) => {
    console.log(
      'The jasmine-failures element was located. Now expecting it to have child divs for the failed ' +
      'specs. Trying to find...'
    )
    return jasmineFailures.findElements(By.css('div'))
  }).then((jasmineFailedSpecs) => {
    var failedSpecsNumber = jasmineFailedSpecs.length
    if (failedSpecsNumber > 0) {
      fail(failedSpecsNumber)
    }
    else {
      throw new Error(
        'Unexpected state. The jasmine-failures element is visible but no child divs ' +
        'were found which are meant to represent failed specs. This script is probably broken.'
      )
    }
  })
}

function pass() {
  return driver.close().then(() => {
    driver.quit()
  })
}

function fail(failedSpecsNumber) {
  return driver.close().then(() => {
    throw new Error(failedSpecsNumber + ' failed specs.')
  })
}
