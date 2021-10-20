import test from 'ava'
import {chromium} from 'playwright'

// TODO: Move to separate files.
const unsavedSessionName = 'Unsaved session'

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
		// slowMo: 1000
	})

	const playwrightPage = t.context.playwrightPage = await browserContext.pages()[0]

	playwrightPage.on('console', async consoleMessage => {
		for (let i = 0; i < consoleMessage.args().length; ++i) {
			const type = consoleMessage.type()
			const consoleMethod = type === 'warning' ? 'warn' : type
			console[consoleMethod](`Console ${type}:` , await consoleMessage.args()[i].jsonValue())
		}
	})
	playwrightPage.on('pageerror', (error) => {
		console.error('Error:', error.message)
	})

	await playwrightPage.goto('chrome://extensions')
	await playwrightPage.click('#devMode')
	const extensionId = (await playwrightPage.innerText('#extension-id')).substring(4)
	await playwrightPage.goto(`chrome-extension://${extensionId}/ui/index.html`)

	playwrightPage.setDefaultTimeout(5000) // Otherwise failed tests hang for ages if waitForEvent is never satisfied.
})

test.afterEach.always(async t => {
	if (process.env.PWDEBUG) await t.context.playwrightPage.waitForTimeout(1000000)
	await t.context.browserContext.close()
})

test('Saving, re-opening, then deleting sessions', async t => {
	const {playwrightPage} = t.context
	const tester = new SessionManagerTester(t, playwrightPage)

	await playwrightPage.reload()
	const sessionManagerTitle = await playwrightPage.title()
	// This is breaking the fourth wall a bit because its actually a window with the session manager that we're making assertions against.
	await tester.assertUnsavedSessions([sessionManagerTitle])

	const [page, window] = await tester.createWindow()
	await playwrightPage.reload() // TODO: Try replacing with page.waitForSelector(selector[, options])
	await tester.assertUnsavedSessions([sessionManagerTitle, await page.title()])

	await tester.createTabs(window.id, urls)
	await tester.closeNewTab(window)

	const savedSessionName = 'Test session'
	await tester.updateUnsavedSessionName(1, savedSessionName)
	await tester.assertUnsavedSessions([sessionManagerTitle, savedSessionName])
	await playwrightPage.reload()
	await tester.assertUnsavedSessions([sessionManagerTitle])
	await tester.assertUnshelvedSessions([savedSessionName])

	await tester.closeWindow(window.id)
	await playwrightPage.reload()
	await tester.assertUnsavedSessions([sessionManagerTitle])
	await tester.assertUnshelvedSessions([])
	await tester.assertShelvedSessions([savedSessionName])

	const updatedSessionName = 'Test session updated'
	await tester.updateShelvedSessionName(0, updatedSessionName)
	await tester.assertShelvedSessions([updatedSessionName])

	const [resumedSessionPage, _] = await Promise.all([
		t.context.browserContext.waitForEvent('page', {timeout: 2000}),
		tester.resumeSessionByIndex(1),
	])
	resumedSessionPage.setDefaultTimeout(2000)

	await playwrightPage.waitForTimeout(1000) // TODO: Find out how to properly wait for resumed session ID to be added to mapping.
	await playwrightPage.reload()
	await tester.assertUnsavedSessions([sessionManagerTitle])
	await tester.assertUnshelvedSessions([updatedSessionName])
	await tester.assertShelvedSessions([])
	const unshelvedSessionWindow = await tester.getCurrentWindow()
	await tester.assertWindowTabUrls(unshelvedSessionWindow, urls)

	t.is((await tester.getWindows()).length, 2)
	await Promise.all([
		resumedSessionPage.waitForEvent('close', {timeout: 2000}),
		tester.deleteSession(updatedSessionName),
	])
	await playwrightPage.waitForTimeout(1000) // TODO: Find out how to properly wait for resumed session ID to be added to mapping.
	t.is((await tester.getWindows()).length, 1)

	await tester.assertUnsavedSessions([sessionManagerTitle])
	await tester.assertUnshelvedSessions([])
	await tester.assertShelvedSessions([])
})

test.todo('Saving, re-opening, then deleting sessions (with keyboard shortcuts)')

class SessionManagerTester {
	constructor (avaExecutionContext, playwrightPage) {
		this.avaExecutionContext = avaExecutionContext
		this.playwrightPage = playwrightPage
	}

	// TODO: Create a SesssionManagerPageAsserter or something like that to avoid passing it as an arg all the time.
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
		if (expectedSessionNames.length) await this.playwrightPage.waitForSelector(`[data-type="${sessionType}"] .session-name`)

		const actualSessionNames = await this.playwrightPage.$$eval(`[data-type="${sessionType}"] .session-name`, sessionNames => sessionNames.map(sessionName => sessionName.textContent))
		this.avaExecutionContext.deepEqual(actualSessionNames, expectedSessionNames)
	}

	async createWindow() {
		const [page, window] = await Promise.all([
			this.avaExecutionContext.context.browserContext.waitForEvent('page'),
			this.playwrightPage.evaluate(() => new Promise(resolve => {
				chrome.windows.create(window => {
					resolve(window)
				})
			})),
		])
		return [page, window]
	}

	async createTab(createProperties) {
		return this.playwrightPage.evaluate(createProperties => new Promise(resolve => {
			chrome.tabs.create(
				createProperties,
				tab => resolve(tab),
			)
		}), createProperties)
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
	}

	async closeWindow (windowId) {
		const window = await this.playwrightPage.evaluate(windowId => new Promise(resolve => {
			chrome.windows.remove(windowId, resolve)
		}), windowId)
		await this.playwrightPage.waitForTimeout(1000) // Necessary because it returns before the window is actually considered closed by Chrome. Wait on page close doesn't work because that's only one tab.
		return window
	}

	async resumeSessionByIndex(sessionIndex) {
		const sessionCards = await this.playwrightPage.$$('.session-card')
		const resumeButton = await sessionCards[sessionIndex].$('.resume-button')
		await resumeButton.click()
	}

	async resumeSessionByName (sessionName) {
		await this.playwrightPage.evaluate(
			sessionName => {
				const sessionCards = document.getElementsByClassName('session-card')
				const sessionCard = Array.prototype.find.call(sessionCards, function (sessionCard) {
					const sessionNameInput = sessionCard.getElementsByClassName('session-name-input')[0] // TODO: Update usages to session-name.textContentg
					return sessionNameInput.value === sessionName
				})
				const resumeButton = sessionCard.getElementsByClassName('resume-button')[0]
				resumeButton.click()
			},
			sessionName,
		)
	}

	async getCurrentWindow() {
		return await this.playwrightPage.evaluate(() => new Promise(resolve => {
			chrome.windows.getLastFocused({populate: true}, window => {
				resolve(window)
			})
		}))
	}

	async getWindows() {
		return await this.playwrightPage.evaluate(() => new Promise(resolve => {
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
		const deleteButton = await this.playwrightPage.$(`.session-card:has-text("${sessionName}") .delete-button`)
		await deleteButton.click()
	}
}