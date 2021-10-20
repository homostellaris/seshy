import {MDCTextField} from '@material/textfield'
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

	// TODO: This method is crazy, needs more encapsulation.
	async edit () {
		const sessionName = this.sessionCard.getElementsByClassName('session-name')[0]
		sessionName.innerHTML = `
			<label class="mdc-text-field mdc-text-field--outlined mdc-text-field--no-label">
				<span class="mdc-notched-outline">
					<span class="mdc-notched-outline__leading"></span>
					<span class="mdc-notched-outline__trailing"></span>
				</span>
				<input class="mdc-text-field__input" type="text" aria-label="Label" value="${this.sessionName}"">
			</label>
		`
		const textField = new MDCTextField(sessionName.querySelector('.mdc-text-field'))
		textField.focus()
		document.querySelector('.mdc-text-field__input').select()

		const editIcon = this.sessionCard.getElementsByClassName('edit-icon')[0]
		editIcon.textContent = 'done'
		editIcon.style.color = '#4CAF50'

		function stopClickBubbling (event) {
			event.stopPropagation()
		}
		this.sessionCard.addEventListener('click', stopClickBubbling)
		editIcon.removeEventListener('click', this.eventHandlers.edit)
		this.sessionCard.removeEventListener('keydown', this.eventHandlers.keydown)

		let editingCompletePromiseResolve
		const editingCompletePromise = new Promise(resolve => {
			editingCompletePromiseResolve = resolve
		})
		editIcon.addEventListener('click', completeEditOnIconClick)
		this.sessionCard.addEventListener('keydown', completeEditOnEnterKey)

		await editingCompletePromise
		await this.save(textField.value)

		this.sessionCard.removeEventListener('click', stopClickBubbling)
		editIcon.removeEventListener('click', completeEditOnIconClick)
		this.sessionCard.removeEventListener('keydown', completeEditOnEnterKey)
		editIcon.addEventListener('click', this.eventHandlers.edit)
		this.sessionCard.addEventListener('keydown', this.eventHandlers.keydown)

		editIcon.textContent = 'edit'
		editIcon.style.color = '#000'

		sessionName.innerHTML = textField.value
		this.sessionCard.focus()

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
		return this.sessionCard.getElementsByClassName('session-name')[0].textContent
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

	async save (sessionName) {
		const bookmarkFolder = await bookmarks.createFolder(sessionName)

		await persistSession(this.windowId, bookmarkFolder.id)
		await openSavedSessionTracker.addOpenSessionWindowId(this.windowId, bookmarkFolder.id)
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
	async save (sessionName) {
		await bookmarks.renameFolder(this.bookmarkFolderId, sessionName)
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

	async save (sessionName) {
		await bookmarks.renameFolder(this.bookmarkFolderId, sessionName)
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