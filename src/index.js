import * as mdc from 'material-components-web'
import 'material-components-web/dist/material-components-web.css'
import './material-icons/index.css'

import '/index.css'
import chrome from '/chrome.js'
import { BookmarkPersistenceManager } from '/persistence/index.js'
import { asyncLoop, isFunction } from '/util.js'
import { Session } from '/session-legacy.js'
import { addKeyboardShortcuts, initialiseKeyboardShortcutsDialog } from './keyboard-shortcuts/index.js'
import { getSessionLists, getSessionsFromSessionList } from './session-manager/index.js'

var bookmarkPersistenceManager = new BookmarkPersistenceManager()

createSessionElements(() => {
	focusCurrentlyOpenSession(callAddKeyboardShortcuts)
})

function callAddKeyboardShortcuts () {
	addKeyboardShortcuts(initialiseMaterialComponents)
}

function initialiseMaterialComponents () {
	mdc.autoInit()
	initialiseKeyboardShortcutsDialog()
}

function createSessionElements (callback) {
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

	chrome.storage.local.get(null, items => {
		console.debug('Storage state:', items)
		createCurrentlyOpenSessions(items)
	})
}

function focusCurrentlyOpenSession (callback) {
	console.log('Focusing currently open session.')
	var focusSessionElement = (currentlyOpenWindow) => {
		var currentlyOpenSessionList = getSessionLists()[0]
		var sessionElements = getSessionsFromSessionList(currentlyOpenSessionList)

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
