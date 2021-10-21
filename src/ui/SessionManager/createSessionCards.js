import {getShelvedSessions, getUnsavedSessions, getUnshelvedSessions} from '../../api/index.js'
import SessionManager from './index.js'

const unsavedSessionsHeader = document.getElementById('unsaved')
const unshelvedSessionsHeader = document.getElementById('unshelved')
const shelvedSessionsHeader = document.getElementById('shelved')

async function createSessionCards () {
	await createUnsavedSessionCards()
	await createUnshelvedSessionCards()
	await createShelvedSessionCards()
	await addTabIndex()
}

async function createUnsavedSessionCards () {
	const unsavedSessions = await getUnsavedSessions()

	unsavedSessions.reverse().map(unsavedSession => {
		const sessionCard = createSessionCard(
			unsavedSession,
			{
				windowId: unsavedSession.windowId,
				type: 'unsaved',
			},
		)
		unsavedSessionsHeader.after(sessionCard)
	})
}

async function createUnshelvedSessionCards () {
	const unshelvedSessions = await getUnshelvedSessions()

	unshelvedSessions.reverse().map(unshelvedSession => {
		const sessionCard = createSessionCard(
			unshelvedSession,
			{
				bookmarkFolderId: unshelvedSession.bookmarkFolderId,
				windowId: unshelvedSession.windowId,
				type: 'unshelved',
			},
		)
		unshelvedSessionsHeader.after(sessionCard)
	})
}

async function createShelvedSessionCards () {
	const shelvedSessions = await getShelvedSessions()

	shelvedSessions.reverse().forEach(async shelvedSession => {
		const sessionCard = createSessionCard(
			shelvedSession,
			{
				bookmarkFolderId: shelvedSession.bookmarkFolderId,
				type: 'shelved',
			},
		)
		shelvedSessionsHeader.after(sessionCard)
	})
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

function createSessionCard (session, dataset = {}) {
	const sessionCard = document.createElement('li')
	sessionCard.setAttribute('role', 'option')
	sessionCard.classList.add('session-card', 'mdc-deprecated-list-item')

	for (const [key, value] of Object.entries(dataset)) {
		sessionCard.dataset[key] = value
	}

	sessionCard.innerHTML = getSessionInnerHtml(session.name, session.tabs.length, session.image)

	const editIcon = sessionCard.getElementsByClassName('edit-icon')[0]
	const resumeIcon = sessionCard.getElementsByClassName('resume-icon')[0]
	const deleteIcon = sessionCard.getElementsByClassName('delete-icon')[0]

	const sessionManager = SessionManager.factory(sessionCard)
	const {edit, resume, remove, keydown} = sessionManager.eventHandlers

	editIcon.addEventListener('click', edit) // Wrapped in an arrow function to keep `this` as the session manager rather than the event object.
	resumeIcon.addEventListener('click', event => {
		resume()
		event.stopPropagation() // Prevent the MDC List click action from taking effect.
	})
	deleteIcon.addEventListener('click', remove)

	sessionCard.addEventListener('keydown', keydown)

	return sessionCard
}

function getSessionInnerHtml (name, tabsCount, thumbnailUrl) {
	var innerHtml = `
	<span class="mdc-deprecated-list-item__ripple"></span>
	<img src="${thumbnailUrl || 'https://www.thebloodytourofyork.co.uk/wp-content/uploads/2020/07/placeholder.png'}" class="mdc-deprecated-list-item__graphic favicon" aria-hidden="true">
    <span class="mdc-deprecated-list-item__text">
	  <span class="session-name mdc-deprecated-list-item__primary-text">${name}</span>
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
