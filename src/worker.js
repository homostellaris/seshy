import { debounce } from 'debounce'
import { isFunction, asyncLoop } from './util.js'
import { BookmarkPersistenceManager } from './persistence/index.js'
import status from './status/index.js'
import {
	getBookmarkFolderId,
	persistSession,
} from './persistence/index.js'

const bookmarkPersistenceManager = new BookmarkPersistenceManager()

initialise()

// Listeners must be at the top-level: https://developer.chrome.com/docs/extensions/mv2/background_migration/#listeners
chrome.windows.onCreated.addListener(
	removePotentiallyReusedWindowIdFromInternalMappingOfOpenSessions
)
chrome.windows.onRemoved.addListener(
	removeClosedSessionFromInternalMappingOfOpenSessions
)
chrome.windows.onFocusChanged.addListener(setActionIcon)
chrome.tabs.onUpdated.addListener(debounce(onUpdatedListener, 2000))
chrome.tabs.onCreated.addListener(tab => console.debug('tab created', tab))
chrome.tabs.onRemoved.addListener(tab => console.debug('tab removed', tab))

async function onUpdatedListener (_, changeInfo, tab) {
	console.debug('tab updated', changeInfo)
	const bookmarkFolderId = await getBookmarkFolderId(tab.windowId)
	const isSavedSession = !!bookmarkFolderId
	if (isSavedSession) {
		console.debug('persisting session')
		persistSession(tab.windowId, bookmarkFolderId)
	}
}

// TODO: Ensure this is loaded before anything else occurs.
// Currently it only works because it finishes before anything tries to reference seshyFolderId.
function initialise () {
	console.log('Extension started, pruning local storage...')
	pruneLocalStorage(() => {
		console.log('Local storage cleared.')
	})
}

function pruneLocalStorage (callback) {
	var windowIdsToRemove = []

	var getAllWindows = (storageObject) => {
		chrome.windows.getAll(null, (windows) => {
			getStorageKeysToBeRemoved(storageObject, windows)
		})
	}

	var getStorageKeysToBeRemoved = (storageObject, windows) => {
		var storedWindowIds = Object.keys(storageObject).map(windowId =>
			parseInt(windowId)
		)
		var currentlyOpenWindowIds = windows.map(aWindow => aWindow.id)

		var iterateFunction = (storedWindowId, callback) => {
			if (!currentlyOpenWindowIds.includes(storedWindowId)) {
				windowIdsToRemove.push(storedWindowId)
			}
			callback()
		}

		asyncLoop(storedWindowIds, iterateFunction, removeStorageKeysIfNecessary)
	}

	var removeStorageKeysIfNecessary = () => {
		if (windowIdsToRemove) {
			var keysToRemove = windowIdsToRemove.map(windowId => windowId.toString())
			chrome.storage.local.remove(keysToRemove, () => {
				if (isFunction(callback)) callback()
			})
		} else {
			if (isFunction(callback)) callback()
		}
	}

	chrome.storage.local.get(null, getAllWindows)
}

// TODO: This may delete the mapping that was just stored by resuming a saved session. Need to move the storage from
// `resumeSession` to here so that there can't be any clash.

// There is an event listener on removal of windows that removes session mappings but unfortunately this does
// not work on the last window. Chrome closes before the cleanup can be done. Must therefore check on window
// creation too.
function removePotentiallyReusedWindowIdFromInternalMappingOfOpenSessions (windowToCheck) {
	console.log('The windows.onCreated event fired. Clearing window to session folder mapping...')
	bookmarkPersistenceManager.removeWindowToSessionFolderMapping(windowToCheck.id, () => {
		bookmarkPersistenceManager.getSession(windowToCheck)
	})
}

/**
 * If a window-to-bookmark-folder-mapping exists then it is considered to be a saved session that is currently open.
 * It is not enough to remove the mapping when a window is opened because any logic that is executed inbetween the
 * window closing and another one opening (such as saving updated sessions) will think that sessions are still open.
 */
function removeClosedSessionFromInternalMappingOfOpenSessions (windowId) {
	console.log(
		'The windows.onRemoved event fired. Clearing window to session folder mapping...'
	)
	// Have to remove the mapping here rather than in `removeWindow` so that it
	bookmarkPersistenceManager.removeWindowToSessionFolderMapping(windowId)
}

function setActionIcon (windowId) {
	var setActionIconToSavedOrUnsaved = storageObject => {
		var bookmarkFolderId = storageObject[windowId]
		if (bookmarkFolderId) {
			status.saved()
		} else {
			status.unsaved()
		}
	}

	bookmarkPersistenceManager.checkIfSavedSession(windowId.toString(), setActionIconToSavedOrUnsaved)
}
