import {isFunction, getSessionNameInput} from '../util.js'
import chrome from '../chrome.js'
import diff from 'hyperdiff'

export class BookmarkPersistenceManager {
	constructor () {
		this.seshyFolderId = null
		this.checkIfSeshyFolderExists()
	}

	/**
   * Callback has no args.
   */
	storeWindowToSessionFolderMapping (windowId, sessionFolderId, callback) {
		var windowToSessionFolderMapping = {}
		windowToSessionFolderMapping[windowId] = sessionFolderId
		console.debug(`Storing window to session folder mapping: ${windowToSessionFolderMapping}`)

		if (isFunction(callback)) {
			chrome.storage.local.set(windowToSessionFolderMapping, callback)
		} else {
			chrome.storage.local.set(windowToSessionFolderMapping)
		}
	}

	/**
   * The callback should take an `items` object as its parameter.
   * If nothing is found in storage for the passed `windowId` then the object will have no keys.
   */
	getWindowToSessionFolderMapping (windowId, callback) {
		chrome.storage.local.get(windowId.toString(), callback)
	}

	removeWindowToSessionFolderMapping (windowId, callback) {
		chrome.storage.local.remove(windowId.toString())
		if (isFunction(callback)) callback()
	}

	// TODO See if using Chrome messages API to communicate with Seshy lib will utilise multiple threads and therefore
	// improve performance.
	// Public methods
	// ---===~ Initialisation ~===----------------------------------------------------------------------------------------
	checkIfSeshyFolderExists () {
		console.log('Checking for existing Seshy folder...')

		var query = {
			'title': 'Seshy',
			'url': null
		}
		chrome.bookmarks.search(query, (bookmarkTreeNodes) => {
			if (bookmarkTreeNodes.length === 0) {
				console.log('No existing Seshy folder, creating...')
				this.createSeshyFolder()
			} else if (bookmarkTreeNodes.length === 1) {
				this.seshyFolderId = bookmarkTreeNodes[0].id
				console.log('Seshy folder already exists with ID ' + this.seshyFolderId + '.')
			} else {
				this.seshyFolderId = bookmarkTreeNodes[0].id
				console.error('More than one Session folder in Other Bookmarks!')
			}
		})
	}

	createSeshyFolder () {
		var bookmark = {
			'title': 'Seshy'
		}
		chrome.bookmarks.create(bookmark, (seshyFolder) => {
			this.seshyFolderId = seshyFolder.id
			var message = 'Created seshy folder with ID ' + this.seshyFolderId + '.'
			console.log(message)
		})
	}

	// ---===~ Session Management ~===--------------------------------------------------------------------------------------
	// TODO Refactor to consume session objects instead of windows.
	/**
   * Save a session. Sessions can be in multiple states when they are saved.
   *
   * The session may be an unsaved one (which means they must be currently open) in which case a new session folder will
   * be created.
   *
   * The session may be saved and shelved, or saved and unshelved (currently open). In either case the existing session
   * folder will be looked up and overwritten.
   */
	saveSession (session, callback) {
		console.log('Saving tab set into bookmarks folder.')

		// TODO Replace with global function.
		var checkIfSavedSession = (session) => {
			if (session.saved()) {
				getBookmarksInFolder(session.bookmarkFolder.id)
			} else {
				this.createSessionFolder(session, (bookmarkTreeNode) => {
					session.bookmarkFolder = bookmarkTreeNode
					this.saveOpenSessionTabs(session, callStoreWindowToSessionFolderMapping)
				})
			}
		}

		// eslint-disable-next-line no-unused-vars
		var setBookmarkFolderOnSession = (bookmarkFolderId, callback) => {
			chrome.bookmarks.getSubTree(bookmarkFolderId, (bookmarkTreeNodes) => {
				session.bookmarkFolder = bookmarkTreeNodes
				callback(bookmarkFolderId)
			})
		}

		var getBookmarksInFolder = (bookmarkFolderId) => {
			chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarksInFolder)
		}

		var removeBookmarksInFolder = (bookmarkTreeNodes) => {
			this.removeBookmarks(bookmarkTreeNodes, callSaveTabsAsBookmarks)
		}

		var callSaveTabsAsBookmarks = () => {
			if (session.currentlyOpen()) {
				this.saveOpenSessionTabs(session, updateBookmarkFolderThenStoreWindowToSessionFolderMapping)
			} else {
				this.saveOpenSessionTabs(session, callback)
			}
		}

		var updateBookmarkFolderThenStoreWindowToSessionFolderMapping = () => {
			session.updateBookmarkFolder(() => {
				callStoreWindowToSessionFolderMapping(callback)
			})
		}

		var callStoreWindowToSessionFolderMapping = () => {
			this.storeWindowToSessionFolderMapping(session.window.id, session.bookmarkFolder.id, () => {
				this.setActionIconToSaved()
				callback()
			})
		}

		session.updateWindow(() => {
			checkIfSavedSession(session)
		})
	}

	renameSession (session, newName, callback) {
		console.log(`Renaming session ${session.name} to ${newName}.`)

		var updateSessionElement = () => {
			var sessionNameInput = getSessionNameInput(session)
			sessionNameInput.value = newName
			if (isFunction(callback)) callback()
		}

		var bookmarkFolderId = session.bookmarkFolder.id
		chrome.bookmarks.update(bookmarkFolderId, {'title': newName}, updateSessionElement)
	}

	/**
   * Resumes a session. The callback has no parameters.
   */
	resumeSession (session, callback) {
		var extractUrlsFromBookmarks = (session) => {
			var sessionFolder = session.bookmarkFolder
			var bookmarks = sessionFolder.children
			var urls = bookmarks.map((bookmark) => { return bookmark.url })
			createWindowForSession(urls)
		}

		var createWindowForSession = (urls) => {
			var createData = {
				'url': urls
			}
			chrome.windows.create(createData, (newWindow) => {
				setTimeout(() => {
					if (isFunction(callback)) {
						this.storeWindowToSessionFolderMapping(newWindow.id, session.bookmarkFolder.id, () => {
							callback(newWindow)
						})
					} else {
						this.storeWindowToSessionFolderMapping(newWindow.id, session.bookmarkFolder.id)
					}
				}, 1000) // TODO: Horrible hack for the bug that means that window created listener can sometimes remove the window ID from the mapping created by.
			})
		}

		if (session.window && session.window.focused) {
			window.close()
			callback()
		} else if (session.currentlyOpen()) {
			var updateInfo = {'focused': true}
			chrome.windows.update(session.window.id, updateInfo, () => {
				if (isFunction(callback)) {
					session.updateWindow(callback)
				} else {
					session.updateWindow()
				}
			})
		} else {
			extractUrlsFromBookmarks(session)
		}
	}

	deleteSession (session, callback) {
		var removeSessionWindowIfOpen = () => {
			if (session.currentlyOpen()) {
				session.updateWindow(() => {
					this.removeWindow(session, removeBookmarkFolderIfSaved)
				})
			} else {
				removeBookmarkFolderIfSaved()
			}
		}

		var removeBookmarkFolderIfSaved = () => {
			if (session.saved()) {
				chrome.bookmarks.removeTree(session.bookmarkFolder.id, callback)
			} else {
				callback()
			}
		}

		this.removeSessionElement(session, removeSessionWindowIfOpen)
	}

	removeSessionElement (session, callback) {
		session.element.remove()
		callback()
	}

	// TODO: Is this method necessary?
	/**
   * Check if the passed window is a saved session and if so callback with its bookmark folder.
   */
	getSession (windowToCheck, callback) {
		var getTabs = (windowToCheck) => {
			if (windowToCheck.tabs) {
				tabs = windowToCheck.tabs
				this.getAllSessionFolders(compareWindowWithSessionFolders)
			} else {
				chrome.tabs.query({windowId: windowToCheck.id}, (windowToCheckTabs) => {
					tabs = windowToCheckTabs
					this.getAllSessionFolders(compareWindowWithSessionFolders)
				})
			}
		}

		var compareWindowWithSessionFolders = (sessionFolders) => {
			var matchingSessionFolder = null

			for (var i = 0; i < sessionFolders.length; i++) {
				var sessionFolder = sessionFolders[i]
				var match = compareTabsToBookmarks(tabs, sessionFolder.children)
				if (match === true) {
					matchingSessionFolder = sessionFolder
					break
				}
			}

			if (matchingSessionFolder === null) {
				console.log('No existing session found for window with ID ' + windowToCheck.id + '.')
			} else {
				console.log('Existing session found in bookmark folder with ID ' + matchingSessionFolder.id +
        ' for window with ID ' + windowToCheck.id + '.')
			}

			if (isFunction(callback)) callback(matchingSessionFolder)
		}

		var compareTabsToBookmarks = (tabs, bookmarks) => {
			if (tabs.length !== bookmarks.length) {
				return false
			}

			for (var i = 0; i < tabs.length && i < bookmarks.length; i++) {
				var tab = tabs[i]
				var bookmark = bookmarks[i]

				if (tab.index !== bookmark.index) {
					return false
				}
				if (tab.url !== bookmark.url) {
					return false
				}
			}
			return true
		}

		var tabs

		console.log('Checking if tab set is a saved session.')
		getTabs(windowToCheck)
	}

	// Private methods
	getSeshyFolder (callback) {
		var query = {
			'title': 'Seshy'
		}
		chrome.bookmarks.search(query, callback)
	}

	getAllSessionFolders (callback) {
		this.getSeshyFolder(getSessionFolders)

		function getSessionFolders (bookmarkTreeNodes) {
			var seshyFolder = bookmarkTreeNodes[0]
			chrome.bookmarks.getSubTree(seshyFolder.id, returnChildren)
		}

		function returnChildren (seshyFolderSearchResults) {
			var seshyFolder = seshyFolderSearchResults[0]
			callback(seshyFolder.children)
		}
	}

	getAllOpenWindows (callback) {
		chrome.windows.getAll({populate: true, windowTypes: ['normal']}, callback)
	}

	checkIfSavedSession (windowToCheckId, callback) {
		this.getWindowToSessionFolderMapping(windowToCheckId, callback)
	}

	createSessionFolder (session, callback) {
		console.log(`Creating session folder for session named '${session.name}'.`)
		var bookmarkInfo = {
			'parentId': this.seshyFolderId,
			'title': session.name
		}
		chrome.bookmarks.create(bookmarkInfo, (bookmarkTreeNode) => {
			callback(bookmarkTreeNode)
		})
	}

	// TODO: No need for sessionFolderId anymore.
	saveOpenSessionTabs (session, callback) {
		session.updateWindow((updatedWindow) => {
			this.saveTabsAsBookmarks(updatedWindow.tabs, session.bookmarkFolder.id, callback)
		})
	}

	// TODO Use this function in `saveSession`.
	saveWindowAsBookmarkFolder (window, bookmarkFolderId, callback) {
		var getBookmarksInFolder = (bookmarkFolderId) => {
			chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarksInFolder)
		}

		var removeBookmarksInFolder = (bookmarkTreeNodes) => {
			if (chrome.runtime.lastError) {
				console.info('Tried to save but bookmark folder was not found. Must have been removed since the tab updated ' +
        'handler was called.')
				callback()
			} else {
				this.removeBookmarks(bookmarkTreeNodes, callSaveTabsAsBookmarks)
			}
		}

		var callSaveTabsAsBookmarks = () => {
			this.saveTabsAsBookmarks(window.tabs, bookmarkFolderId, callback)
		}

		getBookmarksInFolder(bookmarkFolderId)
	}

	saveTabsAsBookmarks (tabs, bookmarkFolderId, callback) {
		console.info('Creating %d bookmarks.', tabs.length)
		// TODO: Validate bookmarks have URLs otherwise they become folders
		// From the docs: "If url is NULL or missing, it will be a folder."
		if (!tabs.every(tab => !!tab.url)) {
			throw new Error(`Tabs don't all have URLs which means bookmark folders will be created instead of bookmarks: ${tabs}`)
		}
		for (var i = 0; i < tabs.length; i++) {
			console.info('Creating bookmark %d', i + 1)
			var tab = tabs[i]

			var createProperties = {
				'parentId': bookmarkFolderId,
				'title': 'Tab ' + i,
				'index': tab.index,
				'url': tab.url
			}

			if (i === tabs.length - 1) {
				chrome.bookmarks.create(createProperties, callback)
				console.debug(`Saved bookmark ${createProperties.url}`)
			} else {
				chrome.bookmarks.create(createProperties)
				console.debug(`Saved bookmark ${createProperties.url}`)
			}
		}
	}

	removeBookmarks (bookmarkTreeNodes, callback) {
		console.info('Removing %d tabs.', bookmarkTreeNodes.length)
		for (var i = 0; i < bookmarkTreeNodes.length; i++) {
			console.info('Removing tab %d', i + 1)
			var bookmarkTreeNode = bookmarkTreeNodes[i]
			chrome.bookmarks.remove(bookmarkTreeNode.id)
			console.debug(`Removed bookmark ${bookmarkTreeNode.id}`)

			if (i === bookmarkTreeNodes.length - 1 && isFunction(callback)) {
				callback()
			}
		}
	}

	removeWindow (session, callback) {
		var preventSessionManagerThinkingSessionIsOpen = () => {
			this.removeWindowToSessionFolderMapping(session.window.id, () => {
				chrome.windows.remove(session.window.id, callback)
			})
		}

		if (session.saved()) {
			this.saveSession(session, preventSessionManagerThinkingSessionIsOpen)
		} else {
			preventSessionManagerThinkingSessionIsOpen()
		}
	}

	// TODO: Duplicate of the function in api.js
	setActionIconToSaved () {
		chrome.action.setIcon({path: '../status/saved.png'})
	}
}

export async function persistSession (windowId, bookmarkFolderId) {
	const window = await chrome.windows.get(windowId, {populate: true})
	const [bookmarkFolder] = await chrome.bookmarks.getSubTree(bookmarkFolderId)

	const {added, removed, common} = diff(bookmarkFolder.children || [], window.tabs || [], 'url')

	const createOperations = added.map(({index, title, url}) => chrome.bookmarks.create({
		index,
		parentId: bookmarkFolder.id,
		title,
		url,
	}))
	const removeOperations = removed.map(tab => chrome.bookmarks.remove(tab.id)) // TODO: Update to use bookmark folder ID
	const moveOperations = common
		.filter(tab => window.tabs[tab.index].url !== bookmarkFolder.children[tab.index].url)
		.map(tab => chrome.bookmarks.move(
			bookmarkFolder.children.find(bookmark => bookmark.url === tab.url).id,
			{index: tab.index})
		)

	await Promise.all([
		...createOperations,
		...removeOperations,
		...moveOperations,
	])
}

export async function getBookmarkFolderId (windowId) {
	const items = await new Promise(resolve => {
		chrome.storage.local.get(windowId.toString(), resolve)
	})
	return items[windowId] || null
}

// export class SessionRepository() {
//     save(session)
//     delete(session)
//     update(session)
//     getBookmarkFolder(windowId)
// }
