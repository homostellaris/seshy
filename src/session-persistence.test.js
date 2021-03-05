process.on('unhandledRejection', up => undefined)
import test from 'ava'
import {chromium} from 'playwright'
import fs from 'fs'

const exampleDotCom = 'http://example.com/'
const githubDotCom = 'https://github.com/'
const playwrightDotCom = 'https://playwright.dev/'

const urls = [
  exampleDotCom,
  githubDotCom,
  playwrightDotCom
]

test.beforeEach(async t => {
  const pathToExtension = 'src/'
  const userDataDir = `/tmp/seshy-development/test-runs/${parseInt(Math.random() * 1000000)}`
  console.log(userDataDir)

  const browserContext = t.context.browserContext = await chromium.launchPersistentContext(userDataDir,{
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ],
    // slowMo: 20
  });
  const page = t.context.sessionManagerPage = await browserContext.pages()[0]

  await page.goto('chrome://extensions');
  await page.click('#devMode')
  const extensionId = (await page.innerText('#extension-id')).substring(4)
  await page.goto(`chrome-extension://${extensionId}/session-manager/index.html`)
})

// test.afterEach(async t => {
//   await t.context.browserContext.close();
// })

// test.after(_ => {
//   fs.rmdirSync('/tmp/seshy-development/', { recursive: true });
// })

test('Saving and re-opening sessions', async t => {
  const {sessionManagerPage} = t.context

  /* This is breaking the fourth wall a bit because its actually a window with the session manager
   * that we're making assertions against.
   */ 
  await assertOneUnsavedSession(t, sessionManagerPage)

  const window = await createWindow(sessionManagerPage)
  await sessionManagerPage.reload()
  await assertTwoUnsavedSessions(t, sessionManagerPage)

  await createTabs(sessionManagerPage, window.id, urls)
  await closeNewTab(sessionManagerPage, window)

  const savedSessionName = 'Test session'
  await updateSessionName(sessionManagerPage, savedSessionName)
  await assertSessionName(t, sessionManagerPage, savedSessionName)

  await closeWindow(sessionManagerPage, window.id)
  // Assert in shelved sessions list

  await sessionManagerPage.reload()
  await Promise.all([
    t.context.browserContext.waitForEvent('page'),
    openShelvedSession(sessionManagerPage, savedSessionName)
  ])

  await sessionManagerPage.reload()
  await assertInCurrentlyOpenSessionList(t, sessionManagerPage, savedSessionName)
  const unshelvedSessionWindow = await getCurrentWindow(sessionManagerPage)
  await assertWindowTabUrls(t, unshelvedSessionWindow, urls)
})

test('Deleting sessions', async t => {
  const {sessionManagerPage} = t.context

  /* This is breaking the fourth wall a bit because its actually a window with the session manager
   * that we're making assertions against.
   */ 
  await assertOneUnsavedSession(t, sessionManagerPage)

  const window = await createWindow(sessionManagerPage)
  await sessionManagerPage.reload()
  await assertTwoUnsavedSessions(t, sessionManagerPage)

  await createTabs(sessionManagerPage, window.id, urls)
  await closeNewTab(sessionManagerPage, window)
  await sessionManagerPage.waitForTimeout(2000)

  const savedSessionName = 'Test session'
  await updateSessionName(sessionManagerPage, savedSessionName)
  await assertSessionName(t, sessionManagerPage, savedSessionName)
  await sessionManagerPage.waitForTimeout(2000)

  await closeWindow(sessionManagerPage, window.id)
  await sessionManagerPage.waitForTimeout(2000)
  // Assert in shelved sessions list

  await sessionManagerPage.reload()
  await Promise.all([
    t.context.browserContext.waitForEvent('page'),
    openShelvedSession(sessionManagerPage, savedSessionName)
  ])

  await sessionManagerPage.reload()
  await assertInCurrentlyOpenSessionList(t, sessionManagerPage, savedSessionName)
  const unshelvedSessionWindow = await getCurrentWindow(sessionManagerPage)
  await assertWindowTabUrls(t, unshelvedSessionWindow, urls)
})

async function assertOneUnsavedSession(t, sessionManagerPage) {
  const sessions = await sessionManagerPage.$$('.session-card')
  t.is(sessions.length, 1)
  const sessionName = await (await sessions[0].$('.session-name-input')).getAttribute('value')
  t.is(sessionName, 'Unsaved Session')
  return { sessions, sessionName }
}

async function assertTwoUnsavedSessions(t, sessionManagerPage) {
  const sessions = await sessionManagerPage.$$('.session-card')
  t.is(sessions.length, 2)
  const sessionName = await (await sessions[1].$('.session-name-input')).getAttribute('value')
  t.is(sessionName, 'Unsaved Session')
  return { sessions, sessionName }
}

async function assertSessionName(t, sessionManagerPage, name) {
  const sessionCardInput = await sessionManagerPage.$('.session-card:nth-child(2) .session-name-input')
  const sessionName = await sessionCardInput.evaluate(input => input.value)
  t.is(sessionName, name)
}

async function createWindow(sessionManagerPage) {
  return await sessionManagerPage.evaluate(() => new Promise(resolve => {
    chrome.windows.create(window => {
      resolve(window)
    })
  }))
}

async function createTab(sessionManagerPage, createProperties) {
  return await sessionManagerPage.evaluate(createProperties => new Promise(resolve => {
    chrome.tabs.create(
      createProperties,
      tab => resolve(tab)
    )
  }), createProperties)
}

async function closeNewTab(sessionManagerPage, window) {
  const newTab = window.tabs[0]
  return await sessionManagerPage.evaluate(newTab => new Promise(resolve => {
    chrome.tabs.remove(newTab.id, resolve)
  }), newTab)
}

async function createTabs(sessionManagerPage, windowId, urls) {
  return await Promise.all(urls.map(url => 
    createTab(sessionManagerPage, {
      windowId,
      url,
    })
  ))
}

async function updateSessionName(sessionManagerPage, name) {
  const editButton = await sessionManagerPage.$('.session-card:nth-child(2) .edit-button')
  await editButton.click()
  await sessionManagerPage.keyboard.type(name)
  await editButton.click()
}

async function closeWindow(sessionManagerPage, windowId) {
  return await sessionManagerPage.evaluate(windowId => new Promise(resolve => {
    chrome.windows.remove(windowId, resolve)
  }), windowId)
}

async function openShelvedSession(sessionManagerPage, sessionName) {
  const resumeButton = await sessionManagerPage.$(`.session-card:has(.session-name-input[value="${sessionName}"]) .resume-button`)
  await resumeButton.click()
}

async function getCurrentWindow(sessionManagerPage) {
  return await sessionManagerPage.evaluate(() => new Promise(resolve => {
    chrome.windows.getLastFocused({populate: true}, window => {
      resolve(window)
    })
  }))
}

async function getAllWindows(sessionManagerPage) {
  return await sessionManagerPage.evaluate(() => new Promise(resolve => {
    chrome.windows.getAll({populate: true}, windows => {
      resolve(windows)
    })
  }))
}

async function assertWindowTabUrls(t, window, urls) {
  const windowTabUrls = window.tabs.map(tab => tab.url)
  t.deepEqual(urls, windowTabUrls)
}

async function assertInCurrentlyOpenSessionList(t, sessionManagerPage, sessionName) {
  const currentlyOpenSession = await sessionManagerPage.$(`.session-card .session-name-input[value="${sessionName}"]`)
  t.truthy(currentlyOpenSession)
}