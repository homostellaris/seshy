import bookmarks from '../../api/chrome/bookmarks.js'
import localStorage from '../../api/chrome/localStorage.js'
import openSavedSessionTracker from '../../api/openSavedSessionTracker/index.js'
import Session from '../../api/session.js'
import SessionManager from './index.js'

const shelvedSessionListId = 'saved-sessions'
const currentlyOpenSessionListId = 'currently-open-sessions' // TODO: Split this up into 3 lists

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
	createShelvedSessionCards()
}

async function getAllOpenWindows () { // TODO: Extract to windows module
	return chrome.windows.getAll({populate: true, windowTypes: ['normal']})
}

function createUnsavedSessionCards (windows) {
	const sessionList = document.getElementById(currentlyOpenSessionListId)

	windows.forEach(window => {
		const session = new Session({
			name: 'Unsaved session',
			tabs: window.tabs,
			saved: false,
		})
		const sessionCard = createSessionCard(session, {
			windowId: window.id,
			type: 'unsaved',
		})
		sessionList.appendChild(sessionCard)
	})
}

async function createUnshelvedSessionCards (windows) {
	const sessionList = document.getElementById(currentlyOpenSessionListId)

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
		})
		sessionList.appendChild(sessionCard)
	})

	await Promise.all(promises)
}

async function createShelvedSessionCards () {
	const shelvedSessionBookmarkFolderIds = await openSavedSessionTracker.getOpenSessionBookmarkFolderIds()
	const shelvedBookmarkFolders = (await bookmarks.getAllFolders())
		.filter(bookmarkFolder => !shelvedSessionBookmarkFolderIds.includes(bookmarkFolder.id)) // TODO: Should maybe check window IDs instead to avoid stale mappings?
	const sessionList = document.getElementById(shelvedSessionListId)

	shelvedBookmarkFolders.forEach(async bookmarkFolder => {
		const session = new Session({
			name: bookmarkFolder.title,
			tabs: bookmarkFolder.children,
			saved: true,
		})
		const sessionCard = createSessionCard(session, {
			bookmarkFolderId: bookmarkFolder.id,
			type: 'shelved',
		})
		sessionList.appendChild(sessionCard)
	})
}

function createSessionCard (session, dataset) {
	const sessionCard = document.createElement('li')

	for (const [key, value] of Object.entries(dataset)) {
		sessionCard.dataset[key] = value
	}

	sessionCard.setAttribute('class', 'session-card mdc-list-item mdc-theme--background mdc-elevation--z2')
	sessionCard.setAttribute('tabindex', '0') // Make `li` element focusable.
	sessionCard.innerHTML = getSessionInnerHtml(session.name, session.tabs.length, session.saved)

	sessionCard.addEventListener('focus', (event) => addSelectedClass(event.target))

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
    <span class="mdc-list-item__graphic">
      <i class="saved-state-icon material-icons" title="saved state">${savedStateIcon}</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="session-name mdc-text-field mdc-text-field--dense mdc-text-field--fullwidth">
        <span class="mdc-text-field__ripple"></span>
        <input type="text" class="session-name-input mdc-text-field__input" value="${name}" readonly="true">
        <span class="mdc-line-ripple"></span>
      </div>
      <span class="tabs-number mdc-list-item__secondary-text">
        ${tabsCount} tabs
      </span>
    </span>
    <span class="mdc-list-item__meta">
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

function addSelectedClass (sessionCard) {
	console.debug('Focus event handler triggered. Removing selected class from existing elements.')
	var selectedSessions = document.getElementsByClassName('selected')
	for (var i = 0; i < selectedSessions.length; i++) {
		selectedSessions[i].classList.remove('selected')
	}
	console.debug('Adding selected class to focused element.')
	sessionCard.classList.add('selected')
}

export default createSessionCards
