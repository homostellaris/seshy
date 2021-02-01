const { chromium } = require('playwright');

(async () => {
  const pathToExtension = require('path').join(__dirname, '.')
  const userDataDir = '/tmp/seshy-development-user-data-dir'
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  })
  const backgroundPage = browserContext.backgroundPages()
  // Test the background page as you would any other page.
  // await page.goto('chrome-extension://' + extensionId + '/html/session-manager.html');
  // await browserContext.close();
})()
