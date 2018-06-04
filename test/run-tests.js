require('chromedriver')
const {Builder, By, until} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const promise = require('selenium-webdriver/lib/promise')

// Headless Chrome does not support extensions.
var chromeOptions = new chrome.Options()
chromeOptions.addArguments('--no-sandbox')
chromeOptions.addArguments('start-maximized')
chromeOptions.addExtensions('output/test.crx')
chromeOptions.setChromeBinaryPath('/usr/bin/google-chrome-unstable')

var driver = new Builder()
  .forBrowser('chrome')
  .setChromeOptions(chromeOptions)
  .build()

// Wait until tests have finished.
driver.wait(until.elementLocated(By.className('jasmine-duration')))

// Although selenium has a promise manager, couldn't find a way to catch the find element error without using the normal
//  promise style to provide an error handler.
driver.findElement(By.css('.jasmine-spec-detail.jasmine-failed')).then((failuresContainer) => {
  fail()
}, (e) => {
  console.log('No failures element so tests must have passed.')
  pass()
})

function pass () {
  if (process.env.TRAVIS) {
    console.log('On Travis so closing Chrome instance.')
    quit()
  }
}

function quit () {
  console.log('Quiting.')
  return driver.close().then(() => {
    driver.quit()
  })
}

// TODO refactor to use promise manager. Find elements was resolving to a promise not the element.
function fail () {
  driver.findElement(By.className('jasmine-failures')).then((jasmineFailures) => {
    console.log(
      'The jasmine-failures element was located. Now expecting it to have child divs for the failed ' +
      'specs. Trying to find...'
    )
    return jasmineFailures.findElements(By.css('.jasmine-failures .jasmine-description a:last-child'))
  }).then((jasmineFailedSpecs) => {
    if (jasmineFailedSpecs.length > 0) {
      exitCodeOne(jasmineFailedSpecs)
    } else {
      throw new Error(
        'Unexpected state. The jasmine-failures element is visible but no child divs ' +
        'were found which are meant to represent failed specs. This script is probably broken.'
      )
    }
  })
}

function exitCodeOne (jasmineFailedSpecs) {
  var failedSpecsNumber = jasmineFailedSpecs.length
  console.error(`${failedSpecsNumber} failed specs found:`)
  promise.map(jasmineFailedSpecs, e => e.getText()).then((texts) => {
    console.error(texts)
    process.exit(1)
  }).then(() => {
    if (process.env.TRAVIS) {
      console.log('On Travis so closing Chrome instance.')
      return driver.close().then(() => {
        process.exit(1)
      })
    } else {
      process.exit(1)
    }
  })
}
