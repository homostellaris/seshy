import {debounce} from 'debounce'
import bookmarks from './api/chrome/bookmarks.js'
import {
	persistSession,
} from './api/index.js'
import {
	getBookmarkFolderId,
} from './api/chrome/bookmarks'
import openSavedSessionTracker from './api/openSavedSessionTracker'
import status from './ui/status/index.js'

(async function () {
	await bookmarks.createSeshyFolder()
}())

const debouncedTabChangeListener = debounce(tabChangeListener, 2000)

// Listeners must be at the top-level: https://developer.chrome.com/docs/extensions/mv2/background_migration/#listeners
chrome.runtime.onStartup.addListener(openSavedSessionTracker.removeStaleWindowIds)
chrome.storage.onChanged.addListener(openSavedSessionTracker.removeStaleWindowIds) // TODO: Is this triggered by the onRemoved listener?
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => debouncedTabChangeListener(onUpdatedListener(tab, changeInfo)))
chrome.tabs.onRemoved.addListener((_, removeInfo) => debouncedTabChangeListener(onRemovedListener(removeInfo)))
chrome.windows.onRemoved.addListener(
	openSavedSessionTracker.removeClosedWindowId,
)
chrome.windows.onFocusChanged.addListener(setActionIcon)

async function tabChangeListener (promise) {
	await promise
}

async function onRemovedListener (removeInfo) {
	console.debug('tab removed', removeInfo)
	if (removeInfo.isWindowClosing) return

	const bookmarkFolderId = await getBookmarkFolderId(removeInfo.windowId)
	const isSavedSession = !!bookmarkFolderId

	if (isSavedSession) {
		console.debug('persisting session')
		persistSession(removeInfo.windowId, bookmarkFolderId)
	}
}

async function onUpdatedListener (tab, changeInfo) {
	console.debug('tab updated', changeInfo)

	const bookmarkFolderId = await getBookmarkFolderId(tab.windowId)
	const isSavedSession = !!bookmarkFolderId

	if (isSavedSession) {
		console.debug('persisting session')
		persistSession(tab.windowId, bookmarkFolderId)
	}
}

async function setActionIcon (windowId) {
	const openSavedSessionWindowIds = await openSavedSessionTracker.getOpenSessionWindowIds()
	const isOpenSavedSession = openSavedSessionWindowIds.includes(windowId.toString())
	if (isOpenSavedSession) {
		status.saved()
	} else {
		status.unsaved()
	}
}
