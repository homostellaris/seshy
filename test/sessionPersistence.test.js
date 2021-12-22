import test from 'ava'
import {chromium} from 'playwright'

const exampleDotCom = 'http://example.com/'
const githubDotCom = 'https://github.com/'
const playwrightDotCom = 'https://playwright.dev/'

const urls = [
	exampleDotCom,
	githubDotCom,
	playwrightDotCom,
]

test.beforeEach(async t => {
	const pathToExtension = 'build/'
	const userDataDir = `/tmp/seshy-development/test-runs/${parseInt(Math.random() * 1000000)}`
	console.debug('Chrome user data directory is', userDataDir, '\n')

	const browserContext = t.context.browserContext = await chromium.launchPersistentContext(userDataDir,{
		headless: false,
		args: [
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`,
		],
		// slowMo: 1000,
	})

	const actionPopup = t.context.actionPopup = await browserContext.pages()[0]

	actionPopup.on('console', async consoleMessage => {
		for (let i = 0; i < consoleMessage.args().length; ++i) {
			const type = consoleMessage.type()
			const consoleMethod = type === 'warning' ? 'warn' : type
			console[consoleMethod](`Console ${type}:` , await consoleMessage.args()[i].jsonValue())
		}
	})
	actionPopup.on('pageerror', (error) => {
		console.error('Error:', error.message)
	})

	await actionPopup.goto('chrome://extensions')
	await actionPopup.click('#devMode')
	const extensionId = (await actionPopup.innerText('#extension-id')).substring(4)
	await actionPopup.goto(`chrome-extension://${extensionId}/ui/index.html`)

	browserContext.setDefaultTimeout(5000) // Otherwise failed tests hang for ages if waitForEvent is never satisfied.
})

test.afterEach.always(async t => {
	if (process.env.PWDEBUG) await t.context.playwrightPage.waitForTimeout(1000000) // Leave the page open for debugging.
	await t.context.browserContext.close()
})

test('Saving, re-opening, then deleting sessions', async t => {
	const {actionPopup} = t.context
	const tester = new SessionManagerTester(t, actionPopup, t.context.browserContext)

	await actionPopup.reload()
	const actionPopupTitle = await actionPopup.title()
	await tester.assertUnsavedSessions([actionPopupTitle]) 	// This is breaking the fourth wall a bit because the action popup itself is being opened in a window rather than as an action popup and is therefore considered a session.
	await tester.assertUnshelvedPlaceholderExists()
	await tester.assertShelvedPlaceholderExists()

	const [window, page] = await tester.createWindow()
	await actionPopup.reload()
	await tester.assertUnsavedSessions([actionPopupTitle, await page.title()])

	await tester.createTabs(window.id, urls)
	await tester.closeNewTab(window)

	const savedSessionName = 'Test session'
	await tester.updateUnsavedSessionName(1, savedSessionName)
	await tester.assertUnsavedSessions([actionPopupTitle, savedSessionName])
	await actionPopup.reload()
	await tester.assertUnsavedSessions([actionPopupTitle])
	await tester.assertUnshelvedSessions([savedSessionName])

	await tester.closeWindow(window.id)
	await actionPopup.reload()
	await tester.assertUnsavedSessions([actionPopupTitle])
	await tester.assertUnshelvedSessions([])
	await tester.assertUnshelvedPlaceholderExists()
	await tester.assertShelvedSessions([savedSessionName])

	const updatedSessionName = 'Test session updated'
	await tester.updateShelvedSessionName(0, updatedSessionName)
	await tester.assertShelvedSessions([updatedSessionName])

	const [unshelvedSessionWindow] = await tester.resumeSession({
		sessionName: updatedSessionName,
		expectedTabsCount: urls.length,
	})
	await actionPopup.reload()

	await tester.assertUnsavedSessions([actionPopupTitle])
	await tester.assertUnshelvedSessions([updatedSessionName])
	await tester.assertShelvedSessions([])
	await tester.assertShelvedPlaceholderExists()
	await tester.assertWindowTabUrls(unshelvedSessionWindow, urls)

	const githubPage = await tester.getPageByUrl(githubDotCom)
	await githubPage.close()
	await tester.waitForDebouncedPersistSession()

	await tester.closeWindow(unshelvedSessionWindow.id)
	await actionPopup.reload()
	const [unshelvedSessionWindowWithNoTab] = await tester.resumeSession({
		sessionName: updatedSessionName,
		expectedTabsCount: urls.length - 1,
	})
	await tester.assertWindowTabUrls(unshelvedSessionWindowWithNoTab, [
		exampleDotCom,
		playwrightDotCom,
	])

	t.is((await tester.getWindows()).length, 2)
	await actionPopup.reload()
	await tester.deleteSession(updatedSessionName),
	t.is((await tester.getWindows()).length, 1)

	await actionPopup.reload()
	await tester.assertUnsavedSessions([actionPopupTitle])
	await tester.assertUnshelvedSessions([])
	await tester.assertShelvedSessions([])
	await tester.assertUnshelvedPlaceholderExists()
	await tester.assertShelvedPlaceholderExists()
})

class SessionManagerTester {
	constructor (avaExecutionContext, playwrightPage, playwrightBrowserContext) {
		this.avaExecutionContext = avaExecutionContext
		this.playwrightPage = playwrightPage
		this.playwrightBrowserContext = playwrightBrowserContext
	}

	async assertUnsavedSessions(expectedUnsavedSessionNames) {
		await this.assertSession('unsaved', expectedUnsavedSessionNames)
	}

	async assertUnshelvedSessions(expectedSessionNames) {
		await this.assertSession('unshelved', expectedSessionNames)
	}

	async assertShelvedSessions(expectedSessionNames) {
		await this.assertSession('shelved', expectedSessionNames)
	}

	async assertSession(sessionType, expectedSessionNames) {
		await this.playwrightPage.waitForSelector(
			`[data-type="${sessionType}"] .session-name`,
			{state: expectedSessionNames.length ? 'visible' : 'hidden'},
		)

		const actualSessionNames = await this.playwrightPage.$$eval(`[data-type="${sessionType}"] .session-name`, sessionNames => sessionNames.map(sessionName => sessionName.textContent))
		this.avaExecutionContext.deepEqual(actualSessionNames, expectedSessionNames)
	}

	async assertUnsavedPlaceholderExists () {
		await this.assertPlaceholderExists('unsaved')
	}

	async assertUnshelvedPlaceholderExists () {
		await this.assertPlaceholderExists('unshelved')
	}

	async assertShelvedPlaceholderExists () {
		await this.assertPlaceholderExists('shelved')
	}

	async assertPlaceholderExists (sessionType) {
		const placeholder = await this.playwrightPage.$(`text=You have no ${sessionType} sessions.`)
		this.avaExecutionContext.not(placeholder, null)
	}

	async createWindow() {
		const [window, page] = await Promise.all([
			this.playwrightPage.evaluate(() => new Promise(resolve => {
				chrome.windows.create(window => {
					resolve(window)
				})
			})),
			this.avaExecutionContext.context.browserContext.waitForEvent('page'),
		])
		return [window, page]
	}

	async createTab(createProperties) {
		return this.playwrightPage.evaluate(createProperties => new Promise(resolve => {
			chrome.tabs.create(
				createProperties,
				tab => resolve(tab),
			)
		}), createProperties)
	}

	async getPageByUrl(url) {
		const context = await this.playwrightPage.context()
		const pages = await context.pages()
		return pages.find(page => page.url() === url)
	}

	async closeNewTab(window) {
		const newTab = window.tabs[0]
		return await this.playwrightPage.evaluate(newTab => new Promise(resolve => {
			chrome.tabs.remove(newTab.id, resolve)
		}), newTab)
	}

	async createTabs(windowId, urls) {
		await Promise.all(urls.map(url => 
			this.createTab({
				windowId,
				url,
			}),
		))
		await this.playwrightPage.waitForTimeout(1000) // Playwright takes too long to recognise the new pages without this :/
		const pages = await this.playwrightPage.context().pages()
		const openedPages = pages.filter(page => urls.includes(page.url()))
		await Promise.all(openedPages.map(openedPage => openedPage.waitForLoadState()))
	}

	async updateUnsavedSessionName (sessionIndex, name) {
		await this.updateSessionName('unsaved', sessionIndex, name)
	}

	async updateUnshelvedSessionName (sessionIndex, name) {
		await this.updateSessionName('unshelved', sessionIndex, name)
	}

	async updateShelvedSessionName (sessionIndex, name) {
		await this.updateSessionName('shelved', sessionIndex, name)
	}

	async updateSessionName (sessionType, sessionIndex, name) {
		const editButtons = await this.playwrightPage.$$(`[data-type="${sessionType}"] .edit-button`)
		const editButton = editButtons[sessionIndex]
		await editButton.click()
		await this.playwrightPage.keyboard.type(name)
		await editButton.click()
		await this.playwrightPage.waitForSelector(`[data-type="${sessionType}"] .edit-button >> nth=${sessionIndex} >> text=edit`)
	}

	async closeWindow (windowId) {
		const window = await this.getWindow(windowId)

		const tabUrls = window.tabs.map(tab => tab.url || tab.pendingUrl)
		const pages = await this.playwrightBrowserContext.pages()
		const pagesForWindow = pages.filter(page => tabUrls.includes(page.url()))

		await Promise.all([
			this.playwrightPage.evaluate(windowId => new Promise(resolve => {
				chrome.windows.remove(windowId, resolve)
			}), window.id),
			...pagesForWindow.map(page => page.waitForEvent('close')),
		])
	}

	async resumeSession({sessionName, expectedTabsCount}) {
		let pages = []
		let tabsCount = 0

		const [window] = await Promise.all([
			this.playwrightPage.evaluate(
				() => new Promise(resolve => {
					chrome.windows.onCreated.addListener(window => {
						chrome.windows.onCreated.removeListener(this)
						resolve(window)
					})
				}),
			),
			this.playwrightBrowserContext.waitForEvent('page', page => {
				pages.push(page)
				return ++tabsCount === expectedTabsCount
			}),
			this.playwrightPage.click(`.session-card:has-text("${sessionName}") .resume-button`),
		])
		await Promise.all(pages.map(page => page.waitForLoadState()))

		const windowWithTabs = await this.getWindow(window.id)

		return [windowWithTabs, pages]
	}

	async getSessionCardByName (sessionName) {
		return this.playwrightPage.$(`.session-card:has-text("${sessionName}")`)
	}

	async getCurrentWindow () {
		return this.playwrightPage.evaluate(() => new Promise(resolve => {
			chrome.windows.getLastFocused({populate: true}, window => {
				resolve(window)
			})
		}))
	}

	async getWindow (id) {
		return this.playwrightPage.evaluate(id => new Promise(resolve => {
			chrome.windows.get(id, {populate: true}, resolve)
		}), id)
	}

	async getWindows () {
		return this.playwrightPage.evaluate(() => new Promise(resolve => {
			chrome.windows.getAll({populate: true}, windows => {
				resolve(windows)
			})
		}))
	}

	async assertWindowTabUrls(window, urls) {
		const windowTabUrls = window.tabs.map(tab => tab.url)
		this.avaExecutionContext.deepEqual(urls, windowTabUrls)
	}

	async deleteSession(sessionName) {
		const [window] = await Promise.all([
			this.playwrightPage.evaluate(
				() => new Promise(resolve => {
					chrome.windows.onRemoved.addListener(window => {
						chrome.windows.onRemoved.removeListener(this)
						resolve(window)
					})
				}),
			),
			this.playwrightPage.evaluate(
				() => new Promise(resolve => {
					chrome.storage.onChanged.addListener(() => {
						chrome.storage.onChanged.removeListener(this)
						resolve()
					})
				}),
			),
			this.playwrightPage.click(`.session-card:has-text("${sessionName}") .delete-button`),
		])
		return window
	}

	async waitForDebouncedPersistSession () {
		await this.playwrightPage.waitForTimeout(3000) // TODO: Find a better way to do this, perhaps by overriding the debounce?
	}
}