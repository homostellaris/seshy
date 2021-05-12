import * as mdc from 'material-components-web'
import 'material-components-web/dist/material-components-web.css'

import './material-icons/index.css'
import '/index.css'
import chrome from '/chrome.js'
import { BookmarkPersistenceManager } from '/persistence/index.js'
import { asyncLoop, isFunction, getSessionNameInput } from '/util.js'
import { Session } from '/session-legacy.js'

var bookmarkPersistenceManager = new BookmarkPersistenceManager()

class SessionManager {
	setUp (callback) {
		var done = () => {
			if (isFunction(callback)) callback()
		}

		var callAddKeyboardShortcuts = () => {
			this.addKeyboardShortcuts(initialiseMaterialComponents)
		}

		var initialiseMaterialComponents = () => {
			mdc.autoInit()
			this.initialiseKeyboardShortcutsDialog(done)
		}

		this.createSessionElements(() => {
			this.focusCurrentlyOpenSession(callAddKeyboardShortcuts)
		})
	}

	initialiseKeyboardShortcutsDialog (callback) {
		var keyboardShortcutsElement = document.querySelector('#keyboard-shortcuts')
		document.dialog = new mdc.dialog.MDCDialog(keyboardShortcutsElement)
		document.dialog.listen('MDCDialog:accept', () => {
			document.body.style.minHeight = 'initial'
		})
		if (isFunction(callback)) callback()
	}

	/**
   * Create session cards to populate session lists.
   */
	createSessionElements (callback) {
		var createCurrentlyOpenSessions = (storageObject) => {
			chrome.windows.getAll({'populate': true, windowTypes: ['normal']}, (windows) => {
				createSessionsFromWindows(windows, storageObject)
			})
		}

		var createSessionsFromWindows = (windows, storageObject) => {
			var createSession = (sessionWindow, callback) => {
				var bookmarkFolderId = storageObject[sessionWindow.id.toString()]
				var bookmarkFolder = null

				if (typeof bookmarkFolderId === 'undefined') {
					createSessionObjectThenCallback(sessionWindow, bookmarkFolder, callback)
				} else {
					chrome.bookmarks.getSubTree(bookmarkFolderId, (bookmarkFolders) => {
						var bookmarkFolder = bookmarkFolders[0]
						createSessionObjectThenCallback(sessionWindow, bookmarkFolder, callback)
					})
				}
			}

			asyncLoop(windows, createSession, () => {
				createShelvedSessions(storageObject)
			})
		}

		var createSessionObjectThenCallback = (sessionWindow, bookmarkFolder, callback) => {
			/* eslint-disable no-new */
			new Session(sessionWindow, bookmarkFolder)
			/* eslint-enable no-new */
			callback()
		}

		var createShelvedSessions = (storageObject) => {
			bookmarkPersistenceManager.getAllSessionFolders((bookmarkFolders) => {
				var currentlyOpenSessionBookmarkFolderIds = Object.values(storageObject)

				var createShelvedSession = (bookmarkFolder, callback) => {
					// If the bookmarkFolderId is in the winow to bookmark folder mapping then it is a currently open session and
					// we do not want to duplicate it.
					if (!currentlyOpenSessionBookmarkFolderIds.includes(bookmarkFolder.id)) {
						/* eslint-disable no-new */
						new Session(null, bookmarkFolder)
						/* eslint-enable no-new */
					}
					callback()
				}
				asyncLoop(bookmarkFolders, createShelvedSession, callback)
			})
		}

		chrome.storage.local.get(null, createCurrentlyOpenSessions)
	}

	focusCurrentlyOpenSession (callback) {
		console.log('Focusing currently open session.')
		var focusSessionElement = (currentlyOpenWindow) => {
			var currentlyOpenSessionList = this.getSessionLists()[0]
			var sessionElements = this.getSessionsFromSessionList(currentlyOpenSessionList)

			for (var i = 0; i < sessionElements.length; i++) {
				var sessionElement = sessionElements[i]
				if (currentlyOpenWindow.id === sessionElement.seshySession.window.id) {
					// var currentlyOpenSessionNameInput = getSessionNameInput(session)
					// currentlyOpenSessionNameInput.focus()
					sessionElement.focus()
					if (isFunction(callback)) callback()
				}
			}
		}

		chrome.windows.getCurrent(null, focusSessionElement)
	}

	addKeyboardShortcuts (callback) {
		document.keydownEventListener = (event) => {
			switch (event.key) {
			case 'ArrowLeft':
				this.selectLastSessionInPreviousSessionList()
				break

			case 'ArrowUp':
				this.selectPreviousSession()
				break

			case 'ArrowRight':
				this.selectFirstSessionInNextSessionList()
				break

			case 'ArrowDown':
				this.selectNextSession()
				break

			case '?':
				document.body.style.minHeight = '424px'
				document.dialog.show()
				break

			default: return // exit this handler for other keys
			}
			event.preventDefault() // prevent the default action (scroll / move caret)
		}

		document.addEventListener('keydown', document.keydownEventListener)

		if (isFunction(callback)) callback()
	}

	selectNextSession () {
		var sessionElement = this.getNextSession()
		if (sessionElement === null) {
			this.selectFirstSessionInNextSessionList()
		} else {
			sessionElement.focus()
		}
	}

	selectPreviousSession () {
		var sessionElement = this.getPreviousSession()
		if (sessionElement === null) {
			this.selectLastSessionInPreviousSessionList()
		} else {
			sessionElement.focus()
		}
	}

	selectFirstSessionInNextSessionList () {
		var nextSessionList = this.getNextSessionList()
		var firstSessionInNextSessionList = this.getSessionsFromSessionList(nextSessionList)[0]
		firstSessionInNextSessionList.focus()
	}

	selectLastSessionInPreviousSessionList () {
		var previousSessionList = this.getPreviousSessionList()
		var sessions = this.getSessionsFromSessionList(previousSessionList)
		var lastSessionInPreviousSessionList = sessions[sessions.length - 1]
		lastSessionInPreviousSessionList.focus()
	}

	getSelectedSession () {
		// Check if focused element is a session-card. Could be a session-name-input for example.
		var element = document.activeElement
		// if (element.tagName === 'BODY') {
		//   return document.querySelector('.session-card');
		// }
		if (element.classList.contains('session-card')) {
			return document.activeElement
		}
		for (var i = 0; i < 10; i++) {
			element = element.parentElement
			if (element.classList.contains('session-card')) {
				return element
			}
		}
		throw Error(`Save was called with unexpected element ${document.activeElement.tagName} focused.`)
	}

	getSelectedSessionNameInput () {
		var selectedSession = this.getSelectedSession()
		var selectedSessionNameInput = getSessionNameInput(selectedSession.seshySession)
		return selectedSessionNameInput
	}

	getNextSession () {
		var sessionElement = this.getSelectedSession()
		return sessionElement.nextElementSibling
	}

	getPreviousSession () {
		var sessionElement = this.getSelectedSession()
		return sessionElement.previousElementSibling
	}

	getNextSessionList () {
		var currentlySelectedSession = this.getSelectedSession()
		var currentSessionList = currentlySelectedSession.parentElement
		var sessionLists = this.getSessionLists()

		for (var i = 0; i < sessionLists.length; i++) {
			var sessionList = sessionLists[i]
			if (sessionList === currentSessionList) {
				var nextSessionListIndex = ++i % sessionLists.length
			}
		}

		return sessionLists[nextSessionListIndex]
	}

	getPreviousSessionList () {
		var currentlySelectedSession = this.getSelectedSession()
		var currentSessionList = currentlySelectedSession.parentElement
		var sessionLists = this.getSessionLists()

		for (var i = 0; i < sessionLists.length; i++) {
			var sessionList = sessionLists[i]
			if (sessionList === currentSessionList) {
				var previousSessionListIndex = (sessionLists.length + --i) % sessionLists.length
				break // Otherwise infinite loop.
			}
		}

		return sessionLists[previousSessionListIndex]
	}

	getSessionLists () {
		return document.getElementsByClassName('session-list')
	}

	getSessionsFromSessionList (sessionList) {
		return sessionList.getElementsByClassName('session-card')
	}

	focusSessionNameInput () {
		var sessionElement = this.getSelectedSession()
		var sessionNameInput = getSessionNameInput(sessionElement.seshySession)
		sessionNameInput.select()
	}
}

new SessionManager().setUp()