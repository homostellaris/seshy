// process.on('unhandledRejection', up => { throw up })
const { chromium } = require('playwright');

let browserContext
let page

beforeAll(async () => {
  const pathToExtension = require('path').join(__dirname, '.')
  const userDataDir = '/tmp/seshy-development-user-data-dir'
  browserContext = await chromium.launchPersistentContext(userDataDir,{
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ],
    slowMo: 50
  });
  browserContext = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ],
    slowMo: 50
  });
  page = await browserContext.newPage()

  await page.goto('chrome://extensions');
  // TODO: Make this only set it of its not already set
  // await page.click('#devMode')
  const extensionId = (await page.innerText('#extension-id')).substring(4)
  await page.goto(`chrome-extension://${extensionId}/session-manager/index.html`)
  const page2 = await browserContext.newPage()
  console.log(extensionId)
  page.evaluate(() => window.open('https://google.com', '_blank'))
})

afterAll(async () => {
  // await browserContext.close();
})

describe('Session persistence', () => {
  test('Saving and restoring sessions', async () => {
    // Assert placeholders
    // Assert welcome message
    // Create a new page
    // Assert unsaved session
    // Create some more pages
    // Assert unsaved session updated
    // Delete some pages
    // Assert unsaved session updated
    // Save session
    // Create some more pages
    // Close session
    // Re-open session
  })

  test('Deleting saved sessions', async () => {

  })
})

describe('Session switching', () => {
  test('Switching to another open session', () => {

  })
})

describe('Onboarding', () => {
  test('Displaying the welcome message', () => {

  })
})

describe('Keyboard shortcuts', () => {
  test('Displaying the reference', () => {

  })
})

describe('Feature', () => {
  test('Story', () => {

  })
})