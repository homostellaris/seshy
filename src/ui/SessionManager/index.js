import bookmarks from '../../api/chrome/bookmarks'
import {getShelvedSession, persistSession} from '../../api'
import openSavedSessionTracker from '../../api/openSavedSessionTracker'

class SessionManager {
	constructor (sessionCard) {
		this.sessionCard = sessionCard
		this.eventHandlers = {
			edit: this.edit.bind(this),
			resume: this.resume.bind(this),
			remove: this.remove.bind(this),
			save: this.save.bind(this),
			keydown: this.keydown.bind(this),
		}
	}

	async edit () {
		const sessionNameInput = this.sessionCard.getElementsByClassName('session-name-input')[0]
		sessionNameInput.readOnly = false
		sessionNameInput.select()

		const editIcon = this.sessionCard.getElementsByClassName('edit-icon')[0]
		editIcon.textContent = 'done'
		editIcon.style.color = '#4CAF50'

		editIcon.removeEventListener('click', this.eventHandlers.edit)
		this.sessionCard.removeEventListener('keydown', this.eventHandlers.keydown)

		let editingCompletePromiseResolve
		const editingCompletePromise = new Promise(resolve => {
			editingCompletePromiseResolve = resolve
		})
		editIcon.addEventListener('click', completeEditOnIconClick)
		this.sessionCard.addEventListener('keydown', completeEditOnEnterKey)

		await editingCompletePromise
		await this.save()

		editIcon.removeEventListener('click', completeEditOnIconClick)
		this.sessionCard.removeEventListener('keydown', completeEditOnEnterKey)
		editIcon.addEventListener('click', this.eventHandlers.edit)
		this.sessionCard.addEventListener('keydown', this.eventHandlers.keydown)

		editIcon.textContent = 'edit'
		editIcon.style.color = '#000'

		sessionNameInput.readOnly = true

		function completeEditOnEnterKey (event) {
			if (event.key === 'Enter') editingCompletePromiseResolve()
		}
		function completeEditOnIconClick () {
			editingCompletePromiseResolve()
		}
	}

	// TODO: Push this up to the whole session manager scope to make it easier to add and remove arrow key event listeners.
	keydown (event) {
		switch (event.key) {
		case 'r':
			this.edit()
			break
		case '#':
			this.remove()
			break
		default: return
		}
		event.preventDefault()
	}

	get sessionName () {
		return this.sessionCard.getElementsByClassName('session-name-input')[0].value
	}
}

class OpenSessionManager extends SessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	async resume () {
		const focusedWindowId = await chrome.windows.getCurrent()
		const isFocused = focusedWindowId === this.windowId

		if (isFocused) {
			window.close() // Close the session manager to show the already focused window.
		} else {
			chrome.windows.update(this.windowId, {focused: true})
		}
	}

	get windowId () {
		return Number(this.sessionCard.dataset.windowId)
	}
}

class UnsavedSessionManager extends OpenSessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	async remove () {
		await chrome.windows.remove(this.windowId)
		this.sessionCard.remove()
	}

	async save () {
		const bookmarkFolder = await bookmarks.createFolder(this.sessionName)

		await persistSession(this.windowId, bookmarkFolder.id)
		await openSavedSessionTracker.addOpenSessionWindowId(this.windowId, bookmarkFolder.id)
		
		const savedStateIcon = this.sessionCard.getElementsByClassName('saved-state-icon')[0]
		savedStateIcon.textContent = 'bookmark'
	}
}

class UnshelvedSessionManager extends OpenSessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	async remove () {
		await chrome.windows.remove(this.windowId)
		// Event listener in worker will remove window ID from storage to stop tracking as an open saved session.
		this.sessionCard.remove()
	}

	// TODO: Fix duplication between these methods and the ShelvedSessionManager methods.
	async save () {
		await bookmarks.renameFolder(this.bookmarkFolderId, this.sessionName)
	}

	get bookmarkFolderId () {
		return this.sessionCard.dataset.bookmarkFolderId
	}
}

class ShelvedSessionManager extends SessionManager {
	constructor (sessionCard) {
		super(sessionCard)
	}

	async resume () {
		const shelvedSession = await getShelvedSession(this.bookmarkFolderId)
		const urls = shelvedSession.tabs.map(tab => tab.url)
		const window = await chrome.windows.create({url: urls}) // The Chrome API uses the singular 'url' even though you can pass an array.
		await openSavedSessionTracker.addOpenSessionWindowId(window.id, this.bookmarkFolderId)
	}

	async remove () {
		await bookmarks.removeFolder(this.bookmarkFolderId)
		this.sessionCard.remove()
	}

	async save () {
		await bookmarks.renameFolder(this.bookmarkFolderId, this.sessionName)
	}

	get bookmarkFolderId () {
		return this.sessionCard.dataset.bookmarkFolderId
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

export default {
	factory,
	ShelvedSessionManager,
	UnsavedSessionManager,
	UnshelvedSessionManager,
}