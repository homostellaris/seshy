import { BookmarkPersistenceManager } from './api/index.js'
import { isFunction, getSessionNameInput } from '/util.js'

var bookmarkPersistenceManager = new BookmarkPersistenceManager()

export function Session (aWindow, bookmarkFolder) {
	if (!aWindow && !bookmarkFolder) {
		throw Error('A session must have either a window or a bookmarks folder.')
	}

	this.name = bookmarkFolder ? bookmarkFolder.title : 'Unsaved Session'
	this.window = aWindow || null
	this.bookmarkFolder = bookmarkFolder || null
	// this.tabs = aWindow ? aWindow.tabs : bookmarkFolder.children

	var listId = aWindow ? 'currently-open-sessions' : 'saved-sessions'
	var sessionList = document.getElementById(listId)

	var sessionElement = document.createElement('li')
	sessionElement.setAttribute('class', 'session-card mdc-list-item mdc-theme--background mdc-elevation--z2')
	sessionElement.setAttribute('tabindex', '0') // Make `li` element focusable.

	var tabsNumber = aWindow ? aWindow.tabs.length : bookmarkFolder.children.length
	sessionElement.innerHTML = this.getSessionInnerHtml(this.name, tabsNumber, this.saved())
	sessionList.appendChild(sessionElement)

	sessionElement.seshySession = this // So this created instance is always easily accessible.
	this.element = sessionElement

	Session.prototype.addEventListeners.call(this)
	// TODO Find out why this doesn't work. Throws syntax error because is not a function.
	// this.addEventListeners()
}

Session.prototype.currentlyOpen = function () {
	return Boolean(this.window)
}

Session.prototype.saved = function () {
	return Boolean(this.bookmarkFolder)
}

Session.prototype.updateWindow = function (callback) {
	var session = this
	function setWindowAndCallback (updatedWindow) {
		session.window = updatedWindow
		console.log(callback)
		callback(updatedWindow)
	}

	chrome.windows.get(this.window.id, {populate: true}, setWindowAndCallback)
}

Session.prototype.updateBookmarkFolder = function (callback) {
	var setBookmarkFolderAndCallback = (bookmarkTreeNodes) => {
		this.bookmarkFolder = bookmarkTreeNodes[0]
		callback(this.bookmarkFolder)
	}

	chrome.bookmarks.getSubTree(this.bookmarkFolder.id, setBookmarkFolderAndCallback)
}

Session.prototype.addEventListeners = function () {
	this.element.addEventListener('focus', () => {
		console.log('Focus event handler triggered. Removing selected class from existing elements.')
		var selectedSessions = document.getElementsByClassName('selected')
		for (var i = 0; i < selectedSessions.length; i++) {
			selectedSessions[i].classList.remove('selected')
		}
		console.log('Adding selected class to focused element.')
		this.element.classList.add('selected')
	})

	this.element.addEventListener('click', (event) => {
		var classList = event.target.classList
		if (classList.contains('edit-icon')) {
			if (this.sessionIsBeingRenamed(event.target)) {
				this.finishEditingSession(this)
			} else {
				this.startEditingSession(this)
			}
		} else if (classList.contains('resume-icon')) {
			this.resumeSession(this)
		} else if (classList.contains('delete-icon')) {
			this.deleteSession()
		}
	})

	this.keydownEventListener = (event) => {
		switch (event.key) {
		case 'r':
			this.startEditingSession(this)
			break

		case '#':
			this.deleteSession()
			break

		default: return
		}
		event.preventDefault()
	}

	this.enterKeydownEventListener = (event) => {
		if (event.key === 'Enter') {
			if (this.sessionIsBeingRenamed(event.target)) {
				this.finishEditingSession(this)
				event.stopPropagation()
			} else {
				this.resumeSession()
				event.stopPropagation()
			}
		}
	}

	this.element.addEventListener('keydown', this.enterKeydownEventListener)
	this.element.addEventListener('keydown', this.keydownEventListener)
}

/**
 * Pass a truthy value to set saved state icon to 'saved' or a falsey value to set it to 'unsaved'.
 */
Session.prototype.setSavedIconState = function (savedBoolean) {
	var savedStateIcon = this.element.getElementsByClassName('saved-state-icon')[0]
	if (savedBoolean) {
		savedStateIcon.textContent = 'bookmark'
	} else {
		savedStateIcon.textContent = 'bookmark_border'
	}
}

Session.prototype.startEditingSession = function (session, callback) {
	session.element.removeEventListener('keydown', session.keydownEventListener)
	document.removeEventListener('keydown', document.keydownEventListener)
	var sessionNameInput = session.element.getElementsByClassName('session-name-input')[0]
	sessionNameInput.readOnly = false
	sessionNameInput.select()
	var editIcon = session.element.getElementsByClassName('edit-icon')[0]
	this.changeEditIconToConfirmEditIcon(editIcon)
	if (isFunction(callback)) callback()
}

Session.prototype.finishEditingSession = function (session, callback) {
	var updateUiState = () => {
		session.element.addEventListener('keydown', session.keydownEventListener)
		document.addEventListener('keydown', document.keydownEventListener)
		var sessionNameInput = session.element.getElementsByClassName('session-name-input')[0]
		sessionNameInput.readOnly = true
		var editIcon = session.element.getElementsByClassName('edit-icon')[0]
		this.changeConfirmEditIconBackToEditIcon(editIcon)
		if (isFunction(callback)) callback()
	}

	this.finishRenamingSession(session, updateUiState)
}

Session.prototype.finishRenamingSession = function (session, callback) {
	if (session.saved()) {
		console.info('Renaming selected session.')
		this.renameSession()
	} else {
		console.info('Saving selected session.')
		this.saveSession()
	}
	if (isFunction(callback)) callback()
}

Session.prototype.changeEditIconToConfirmEditIcon = function (editIcon) {
	editIcon.textContent = 'done'
	editIcon.style.color = '#4CAF50'
}

Session.prototype.changeConfirmEditIconBackToEditIcon = function (editIcon) {
	editIcon.textContent = 'edit'
	editIcon.style.color = '#000'
}

Session.prototype.renameSession = function (callback) {
	var sessionNameInput = getSessionNameInput(this)
	var newName = sessionNameInput.value

	if (isFunction(callback)) {
		bookmarkPersistenceManager.renameSession(this, newName, callback)
	} else {
		bookmarkPersistenceManager.renameSession(this, newName)
	}
}

Session.prototype.resumeSession = function (callback) {
	if (isFunction(callback)) {
		bookmarkPersistenceManager.resumeSession(this, callback)
	} else {
		bookmarkPersistenceManager.resumeSession(this)
	}
}

Session.prototype.deleteSession = function (callback) {
	// TODO implement this behaviour somewhere else.
	// var focusNextSessionCardThenCallback = () => {
	//   nextSessionCard.focus()
	//   if (isFunction(callback)) callback()
	// }

	bookmarkPersistenceManager.deleteSession(this.element.seshySession, callback)
}

Session.prototype.sessionIsBeingRenamed = function (element) {
	var editIcon
	if (element.classList.contains('edit-icon')) {
		editIcon = element
	} else {
		editIcon = this.element.getElementsByClassName('edit-icon')[0]
	}
	return Boolean(editIcon.textContent === 'done')
}

Session.prototype.saveSession = function (callback) {
	var updateSavedStateIcon = () => {
		this.setSavedIconState(true)
		if (isFunction(callback)) callback()
	}

	var sessionNameInput = getSessionNameInput(this)

	this.name = sessionNameInput.value // Session instance was created before name input text changed so must update.
	bookmarkPersistenceManager.saveSession(this, updateSavedStateIcon)
}

/**
 * Get the HTML for a single session.
 */
Session.prototype.getSessionInnerHtml = function (title, tabsNumber, saved) {
	var savedStateIcon = saved ? 'bookmark' : 'bookmark_border'
	var innerHtml = `
    <span class="mdc-list-item__graphic">
      <i class="saved-state-icon material-icons" title="saved state">${savedStateIcon}</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="session-name mdc-text-field mdc-text-field--dense mdc-text-field--fullwidth">
        <span class="mdc-text-field__ripple"></span>
        <input type="text" class="session-name-input mdc-text-field__input" value="${title}" readonly="true">
        <span class="mdc-line-ripple"></span>
      </div>
      <span class="tabs-number mdc-list-item__secondary-text">
        ${tabsNumber} tabs
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
