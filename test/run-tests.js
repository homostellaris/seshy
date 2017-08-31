require('chromedriver')
const webdriver = require('selenium-webdriver'),
      chrome = require('selenium-webdriver/chrome')

var chromeOptions = new chrome.Options()
chromeOptions.addExtensions('output/test.crx')

var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .setChromeOptions(chromeOptions)
  .build()
