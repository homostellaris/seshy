import * as mdc from 'material-components-web'

class ShelvedSessionManager {
	constructor (sessionCard) {
		this.sessionCard = sessionCard
	}

	resume () {

	}

	remove () {

	}

	rename () {

	}
}

class UnsavedSessionManager {
	constructor (sessionCard) {
		this.sessionCard = sessionCard
	}

	async resume () {
		const isFocused = document.activeElement === this.sessionCard

		if (isFocused) {
			window.close() // Close the session manager to show the already focused window.
		} else {
			const windowId = Number(this.sessionCard.dataset.id)
			chrome.windows.update(windowId, {focused: true})
		}
	}

	remove () {

	}

	rename () {

	}
}

class UnshelvedSessionManager {
	constructor (sessionCard) {
		this.sessionCard = sessionCard
	}

	resume () {

	}

	remove () {

	}

	rename () {

	}
}

export function factory(sessionCard) {
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