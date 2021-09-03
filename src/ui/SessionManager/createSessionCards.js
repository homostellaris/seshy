import bookmarks from '../../api/chrome/bookmarks.js'
import localStorage from '../../api/chrome/localStorage.js'
import openSavedSessionTracker from '../../api/openSavedSessionTracker/index.js'
import Session from '../../api/session.js'
import SessionManager from './index.js'

const sessionList = document.getElementById('sessions')

async function createSessionCards () {
	const windows = await getAllOpenWindows()
	const openSavedSessionWindowIds = await openSavedSessionTracker.getOpenSessionWindowIds()

	const windowsUnsaved = []
	const windowsUnshelved = []

	windows.forEach(window => {
		if (openSavedSessionWindowIds.includes(window.id.toString())) {
			windowsUnshelved.push(window)
		} else {
			windowsUnsaved.push(window)
		}
	})

	createUnsavedSessionCards(windowsUnsaved)
	await createUnshelvedSessionCards(windowsUnshelved)
	await createShelvedSessionCards()
	createDividers()
	await addTabIndex()
}

async function getAllOpenWindows () { // TODO: Extract to windows module
	return chrome.windows.getAll({populate: true, windowTypes: ['normal']})
}

function createUnsavedSessionCards (windows) {
	windows.forEach(window => {
		const session = new Session({
			name: 'Unsaved session',
			tabs: window.tabs,
			saved: false,
		})
		const sessionCard = createSessionCard(session, {
			windowId: window.id,
			type: 'unsaved',
		}, true)
		sessionList.appendChild(sessionCard)
	})
}

async function createUnshelvedSessionCards (windows) {
	const promises = windows.map(async window => {
		const unshelvedSessionIdMappings = await localStorage.getAll() // TODO: Abstract this away into a higher-level module rather than calling localStorage directly
		const bookmarkFolderId = unshelvedSessionIdMappings[window.id.toString()]
		const bookmarkFolder = await bookmarks.getFolder(bookmarkFolderId)

		const session = new Session({
			name: bookmarkFolder.title,
			tabs: bookmarkFolder.children,
			saved: true,
		})
		const sessionCard = createSessionCard(session, {
			bookmarkFolderId,
			windowId: window.id,
			type: 'unshelved',
		}, true)
		sessionList.appendChild(sessionCard)
	})

	await Promise.all(promises)
}

async function createShelvedSessionCards () {
	const shelvedSessionBookmarkFolderIds = await openSavedSessionTracker.getOpenSessionBookmarkFolderIds()
	const shelvedBookmarkFolders = (await bookmarks.getAllFolders())
		.filter(bookmarkFolder => !shelvedSessionBookmarkFolderIds.includes(bookmarkFolder.id)) // TODO: Should maybe check window IDs instead to avoid stale mappings?

	shelvedBookmarkFolders.forEach(async bookmarkFolder => {
		const session = new Session({
			name: bookmarkFolder.title,
			tabs: bookmarkFolder.children,
			saved: true,
		})
		const sessionCard = createSessionCard(session, {
			bookmarkFolderId: bookmarkFolder.id,
			type: 'shelved',
		}, false)
		sessionList.appendChild(sessionCard)
	})
}

function createDividers () {
	const sessionCards = document.getElementsByClassName('session-card')

	for (let sessionCard of sessionCards) {
		if (sessionCard.nextSibling === null) continue
		const divider = createDivider()
		sessionCard.after(divider)
	}
}

async function addTabIndex () {
	const currentlyOpenWindow = await chrome.windows.getCurrent(null)
	const sessionCard = document.querySelector(`[data-window-id="${currentlyOpenWindow.id}"]`)
	sessionCard.setAttribute('tabindex', '0') // Make `li` element focusable.
	sessionCard.setAttribute('aria-current', true) // Make `li` element focusable.
	sessionCard.setAttribute('aria-selected', true) // Make `li` element focusable.
	sessionCard.classList.add('mdc-deprecated-list-item--selected')
	sessionCard.focus()
}

function createDivider () {
	const dividerElement = document.createElement('li')
	dividerElement.innerHTML = '<li role="separator" class="mdc-deprecated-list-divider"></li>'
	return dividerElement
}

function createSessionCard (session, dataset, activated) {
	const sessionCard = document.createElement('li')
	sessionCard.setAttribute('role', 'option')
	sessionCard.classList.add('session-card', 'mdc-deprecated-list-item')
	if (activated) sessionCard.classList.add('mdc-deprecated-list-item--activated')

	for (const [key, value] of Object.entries(dataset)) {
		sessionCard.dataset[key] = value
	}

	sessionCard.innerHTML = getSessionInnerHtml(session.name, session.tabs.length, session.saved)

	const editIcon = sessionCard.getElementsByClassName('edit-icon')[0]
	const resumeIcon = sessionCard.getElementsByClassName('resume-icon')[0]
	const deleteIcon = sessionCard.getElementsByClassName('delete-icon')[0]

	const sessionManager = SessionManager.factory(sessionCard)
	const {edit, resume, remove, keydown} = sessionManager.eventHandlers

	editIcon.addEventListener('click', edit) // Wrapped in an arrow function to keep `this` as the session manager rather than the event object.
	resumeIcon.addEventListener('click', resume)
	deleteIcon.addEventListener('click', remove)

	sessionCard.addEventListener('keydown', keydown)

	return sessionCard
}

function getSessionInnerHtml (name, tabsCount, saved) {
	var savedStateIcon = saved ? 'bookmark' : 'bookmark_border'
	var innerHtml = `
	<span class="mdc-deprecated-list-item__ripple"></span>
    <span class="mdc-deprecated-list-item__text">
	  <span class="mdc-deprecated-list-item__primary-text">${name}</span>
	  <span class="mdc-deprecated-list-item__secondary-text">${tabsCount} tabs</span>
    </span>
    <span class="mdc-deprecated-list-item__meta">
      <button class="edit-button" title="edit">
        <i class="edit-icon material-icons">edit</i>
      </button>
      <button class="resume-button" title="resume">
        <i class="resume-icon material-icons">open_in_new</i>
      </button>
      <button class="delete-button" title="delete">
        <i class="delete-icon material-icons">delete</i>
      </button>
    </span>
  `
	return innerHtml
}

export default createSessionCards
