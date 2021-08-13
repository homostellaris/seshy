import localStorage from '../chrome/localStorage.js'

// TODO: Prefer the terminology 'unshelved' session here and everywhere else.
/**
 * We need to know which windows represent which sessions so the extensions can do basic functions like
 * update the correct bookmark folder and display correctly in the UI but there is no way to holistically
 * determine which windows represent which sessions other than keeping a record of the windows that are created
 * and removed when the user opens or closes sessions throug the UI.
 */

async function addOpenSessionWindowId (windowId, bookmarkFolderId) {
	await localStorage.add(windowId, bookmarkFolderId)
}

async function getOpenSessionBookmarkFolderIds () {
	const items = await localStorage.getAll()
	return items ? Object.values(items) : []
}

async function getOpenSessionWindowIds () {
	const items = await localStorage.getAll()
	return items ? Object.keys(items) : []
}

/**
 * When a window is closed we want to remove its ID from the tracker
 * so that we do not think it still represents an open session
 * and do things like show it in the open sessions section of the UI.
 */
async function removeClosedWindowId (windowId) {
	console.debug(`chrome.windows.onRemoved event fired, removing window ID: ${windowId}`)
	return new Promise(resolve => {
		chrome.storage.local.remove(windowId.toString(), resolve)
	})
}
	
/**
 * Sometimes the tracker can get stale window IDs that were not removed when the window was closed.
 * One way this can happen is when the all the windows in a Chrome instance are closed in which case
 * the onRemoved listener is not fired for the final window therefore leaving its window ID in local storage.
 */
async function removeStaleWindowIds () {
	const openWindows = await chrome.windows.getAll()
	const openWindowIds = openWindows.map(window => window.id.toString())
	const openSessionWindowIds = await getOpenSessionWindowIds()

	const staleWindowIds = openSessionWindowIds
		.filter(windowId => !openWindowIds.includes(windowId))
		.map(windowId => windowId.toString())

	console.debug(`storage.local.onChange event fired, removing stale window IDs: ${staleWindowIds}`)
	if (staleWindowIds.length) await localStorage.remove(staleWindowIds)
}

export default {
	addOpenSessionWindowId,
	getOpenSessionBookmarkFolderIds,
	getOpenSessionWindowIds,
	removeClosedWindowId,
	removeStaleWindowIds,
}