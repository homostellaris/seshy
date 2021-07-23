import * as mdc from 'material-components-web'
import bookmarks from '../../api/bookmarks'
import {persistSession} from '../../api'
import openSavedSessionTracker from '../../api/openSavedSessionTracker'

class SessionManager {
	constructor (sessionCard) {
		this.sessionCard = sessionCard
		this.eventHandlers = {
			edit: this.edit.bind(this),
			resume: this.resume.bind(this),
			remove: this.remove.bind(this),
			save: this.save.bind(this),
		}
	}

	get windowId () {
		return Number(this.sessionCard.dataset.id)
	}
}

class ShelvedSessionManager extends SessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	edit () {

	}

	resume () {

	}

	remove () {

	}

	save () {

	}
}

class UnsavedSessionManager extends SessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	async edit () {
		const sessionNameInput = this.sessionCard.getElementsByClassName('session-name-input')[0]
		sessionNameInput.readOnly = false
		sessionNameInput.select()

		const editIcon = this.sessionCard.getElementsByClassName('edit-icon')[0]
		editIcon.textContent = 'done'
		editIcon.style.color = '#4CAF50'

		editIcon.removeEventListener('click', this.eventHandlers.edit)
		await new Promise(resolve => {
			editIcon.addEventListener('click', resolve)
		})

		await this.save()

		editIcon.addEventListener('click', this.eventHandlers.edit)
		editIcon.textContent = 'edit'
		editIcon.style.color = '#000'

		sessionNameInput.readOnly = true
	}

	async resume () {
		const isFocused = document.activeElement === this.sessionCard

		if (isFocused) {
			window.close() // Close the session manager to show the already focused window.
		} else {
			chrome.windows.update(this.windowId, {focused: true})
		}
	}

	async remove () {
		await chrome.windows.remove(this.windowId)
	}

	async save () {
		const sessionName = this.sessionCard.getElementsByClassName('session-name-input')[0].value
		const bookmarkFolder = await bookmarks.createFolder(sessionName)
		const windowId = Number(this.sessionCard.dataset.id)

		await persistSession(windowId, bookmarkFolder.id)
		await openSavedSessionTracker.addOpenSessionWindowId(windowId, bookmarkFolder.id)
		
		const savedStateIcon = this.sessionCard.getElementsByClassName('saved-state-icon')[0]
		savedStateIcon.textContent = 'bookmark'
	}
}

class UnshelvedSessionManager extends SessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	edit () {

	}

	resume () {

	}

	remove () {

	}

	save () {
		
	}
}

export function factory (sessionCard) {
	const sessionType = sessionCard.dataset.type

	if (sessionType === 'unsaved') {
		return new UnsavedSessionManager(sessionCard)
	} else if (sessionType === 'unshelved') {
		return new UnshelvedSessionManager(sessionCard)
	} else if (sessionType === 'shelved') {
		return new ShelvedSessionManager(sessionCard)
	}

	throw new Error('Unknown session type', sessionType)
}

export function getSessionLists () {
	return document.getElementsByClassName('session-list')
}

export function getSessionsFromSessionList (sessionList) {
	return sessionList.getElementsByClassName('session-card')
}

export function initialiseMaterialComponents () {
	mdc.autoInit()
}

export async function focusCurrentlyOpenSession () {
	const currentlyOpenWindow = await chrome.windows.getCurrent(null)
	const sessionCard = document.querySelector(`[data-id="${currentlyOpenWindow.id}"]`)
	sessionCard.focus()
}

export default {
	factory,
	ShelvedSessionManager,
	UnsavedSessionManager,
	UnshelvedSessionManager,
}