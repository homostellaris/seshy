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
	playwrightDotCom
]

test.beforeEach(async t => {
	const pathToExtension = 'build/'
	const userDataDir = `/tmp/seshy-development/test-runs/${parseInt(Math.random() * 1000000)}`
	console.debug('Chrome user data directory is', userDataDir, '\n')

	const browserContext = t.context.browserContext = await chromium.launchPersistentContext(userDataDir,{
		headless: false,
		args: [
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`
		],
		// slowMo: 1000
	})

	const playwrightPage = t.context.playwrightPage = await browserContext.pages()[0]

	playwrightPage.on('console', async consoleMessage => {
		for (let i = 0; i < consoleMessage.args().length; ++i) {
			const type = consoleMessage.type()
			console[type](`Console ${type}:` , await consoleMessage.args()[i].jsonValue())
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
	// This is breaking the fourth wall a bit because its actually a window with the session manager that we're making assertions against.
	await tester.assertOpenSessions([unsavedSessionName])

	const [window] = await tester.createWindow()
	await playwrightPage.reload() // TODO: Try replacing with page.waitForSelector(selector[, options])
	await tester.assertOpenSessions([unsavedSessionName, unsavedSessionName])

	await tester.createTabs(window.id, urls)
	await tester.closeNewTab(window)

	const savedSessionName = 'Test session'
	await tester.updateUnsavedSessionName(1, savedSessionName)
	await tester.assertOpenSessions([unsavedSessionName, savedSessionName])

	await tester.closeWindow(window.id)
	await playwrightPage.reload()
	await tester.assertOpenSessions([unsavedSessionName])
	await tester.assertShelvedSessions([savedSessionName])

	const updatedSessionName = 'Test session updated'
	await tester.updateShelvedSessionName(0, updatedSessionName)
	await tester.assertShelvedSessions([updatedSessionName])

	const [resumedSessionPage, _] = await Promise.all([
		t.context.browserContext.waitForEvent('page', {timeout: 2000}),
		tester.resumeSessionByIndex(1)
	])
	resumedSessionPage.setDefaultTimeout(2000)

	await playwrightPage.waitForTimeout(1000) // TODO: Find out how to properly wait for resumed session ID to be added to mapping.
	await playwrightPage.reload()
	await tester.assertOpenSessions([unsavedSessionName, updatedSessionName])
	await tester.assertShelvedSessions([])
	const unshelvedSessionWindow = await tester.getCurrentWindow()
	await tester.assertWindowTabUrls(unshelvedSessionWindow, urls)

	t.is((await tester.getWindows()).length, 2)
	await Promise.all([
		resumedSessionPage.waitForEvent('close', {timeout: 2000}),
		tester.deleteSession(updatedSessionName)
	])
	await playwrightPage.waitForTimeout(1000) // TODO: Find out how to properly wait for resumed session ID to be added to mapping.
	t.is((await tester.getWindows()).length, 1)
	const sessions = await tester.getSessionNames()
	t.deepEqual(sessions, [unsavedSessionName])
})

test.todo('Saving, re-opening, then deleting sessions (with keyboard shortcuts)')

class SessionManagerTester {
	constructor (avaExecutionContext, playwrightPage) {
		this.avaExecutionContext = avaExecutionContext
		this.playwrightPage = playwrightPage
	}

	// TODO: Create a SesssionManagerPageAsserter or something like that to avoid passing it as an arg all the time.
	async assertOpenSessions(expectedUnsavedSessionNames) {
		const unsavedSessionNames = await this.playwrightPage.$$eval('#currently-open-sessions .session-card input', inputs => inputs.map(input => input.value))
		this.avaExecutionContext.deepEqual(unsavedSessionNames, expectedUnsavedSessionNames)
	}

	async assertShelvedSessions(expectedShelvedSessionNames) {
		const shelvedSessionNames = await this.playwrightPage.$$eval('#saved-sessions .session-card input', inputs => inputs.map(input => input.value))
		this.avaExecutionContext.deepEqual(shelvedSessionNames, expectedShelvedSessionNames)
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
		return [window, page]
	}

	async createTab(createProperties) {
		return this.playwrightPage.evaluate(createProperties => new Promise(resolve => {
			chrome.tabs.create(
				createProperties,
				tab => resolve(tab)
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
			})
		))
		await this.playwrightPage.waitForTimeout(1000) // Playwright takes too long to recognise the new pages without this :/
		const pages = await this.playwrightPage.context().pages()
		const openedPages = pages.filter(page => urls.includes(page.url()))
		await Promise.all(openedPages.map(openedPage => openedPage.waitForLoadState()))
	}

	async updateUnsavedSessionName (sessionIndex, name) {
		const editButton = await this.playwrightPage.$(`#currently-open-sessions .session-card:nth-child(${sessionIndex + 1}) .edit-button`)
		await editButton.click()
		await this.playwrightPage.keyboard.type(name)
		await editButton.click()
	}

	async updateShelvedSessionName (sessionIndex, name) {
		const editButton = await this.playwrightPage.$(`#saved-sessions .session-card:nth-child(${sessionIndex + 1}) .edit-button`)
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
					const sessionNameInput = sessionCard.getElementsByClassName('session-name-input')[0]
					return sessionNameInput.value === sessionName
				})
				const resumeButton = sessionCard.getElementsByClassName('resume-button')[0]
				resumeButton.click()
			},
			sessionName
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
		const deleteButton = await this.playwrightPage.$(`.session-card:has(.session-name-input[value="${sessionName}"]) .delete-button`)
		await deleteButton.click()
	}

	async getSessionNames() {
		const sessionNameInputs = await this.playwrightPage.$$('.session-name-input')
		const sessionNames = await Promise.all(sessionNameInputs.map(session => session.getAttribute('value')))
		return sessionNames
	}
}