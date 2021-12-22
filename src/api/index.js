import diff from 'hyperdiff'
import bookmarks from './chrome/bookmarks.js'
import localStorage from './chrome/localStorage.js'
import openSavedSessionTracker from './openSavedSessionTracker/index.js'
import {ShelvedSession, UnsavedSession, UnshelvedSession} from './session.js'

let concurrency = 0

// TODO: Is there any way to simplify thing using array order instead of the index property?
export async function persistSession (windowId, bookmarkFolderId) {
	if (++concurrency > 1) console.warn(`Concurency is ${concurrency} at ${new Date()}`)

	const window = await chrome.windows.get(windowId, {populate: true})
	// Other tab will have index 0 in the real window and so will displace .seshy index when their move operations come through.
	const imageTab = getImageTab(window)
	const windowTabs = [imageTab, ...window.tabs.map(tab => ({...tab, index: tab.index + 1}))]

	if (windowTabs.find(tab => tab.pendingUrl)) return // Tabs with an empty string for their url property aren't 'committed' yet and will have a pendingUrl value instead. I don't know what that means but it doesn't sound great. What's more they don't have titles which we need for creating bookmarks that are readable. Another tab update should be fired once they are committed so it should be picked up later anyway.
	console.debug('persisting session')

	const [bookmarkFolder] = await chrome.bookmarks.getSubTree(bookmarkFolderId)

	const {added, removed, common} = diff(bookmarkFolder.children || [], windowTabs || [], 'url')

	const createOperations = added.map(({index, title, url}) => chrome.bookmarks.create({
		index,
		parentId: bookmarkFolder.id,
		title,
		url,
	}))
	const removeOperations = removed.map(tab => chrome.bookmarks.remove(tab.id))
	const moveOperations = getMoveOperations(common, windowTabs)

	await Promise.all([
		...createOperations,
		...removeOperations,
		...moveOperations,
	])

	concurrency -= 1
}

/**
 * Moving a bookmark to a lower index will increment the index of the bookmarks between the target index and the current index (including the existing bookmark at the target index).
 * Moving a bookmark to a higher index will decrement the index of the bookmarks between the target index and the current index (including the existing bookmark at the target index).
 * There is also a bug that means tabs are moved to the index one less than the one passed as an argument when the bookmark is moving to a higher index than its current one: https://stackoverflow.com/questions/13264060/chrome-bookmarks-api-using-move-to-reorder-bookmarks-in-the-same-folder
 * 
 * @param {*} tabs 
 * @param {*} bookmarks 
 * @returns 
 */
function getMoveOperations (bookmarks, tabs) {
	return bookmarks
		.filter(bookmark => {
			const tabWithSameUrl = tabs.find(windowTab => windowTab.url === bookmark.url)
			const tabHasMoved = bookmark.index !== tabWithSameUrl.index
			return tabHasMoved
		})
		.map(bookmark => {
			const tabWithSameUrl = tabs.find(windowTab => windowTab.url === bookmark.url)
			return chrome.bookmarks.move(bookmark.id, {index: tabWithSameUrl.index})
		})
}

function getImageTab(window) {
	const image = window.tabs[0].favIconUrl
	if (!image) {
		console.warn('Unable to find image for url ' + window.tabs[0].url)
	}

	const url = new URL(`seshy:///${image ? '?image=' + image : ''}`).toString()
	return {
		index: 0,
		title: '.seshy',
		url,
	}
}

export async function getShelvedSession (bookmarkFolderId) {
	const bookmarkFolder = await bookmarks.getFolder(bookmarkFolderId)
	const seshyBookmark = bookmarkFolder.children.find(bookmark => bookmark.title === '.seshy')
	const image = seshyBookmark ? new URL(seshyBookmark.url).searchParams.get('image') : null
	const tabs = bookmarkFolder.children.filter(bookmark => bookmark !== seshyBookmark)

	return new ShelvedSession({
		bookmarkFolderId: bookmarkFolder.id,
		image,
		name: bookmarkFolder.title,
		tabs,
	})
}

export async function getShelvedSessions () {
	const bookmarkFolders = await bookmarks.getAllFolders()
	const shelvedSessionBookmarkFolderIds = await openSavedSessionTracker.getOpenSessionBookmarkFolderIds()
	const shelvedBookmarkFolders = bookmarkFolders
		.filter(bookmarkFolder => !shelvedSessionBookmarkFolderIds.includes(bookmarkFolder.id)) // TODO: Should maybe check window IDs instead to avoid stale mappings?

	const shelvedSessions = shelvedBookmarkFolders.map(bookmarkFolder => {
		const bookmarks = bookmarkFolder.children
		const seshyBookmark = bookmarks.find(bookmark => bookmark.title === '.seshy')

		const image = seshyBookmark ? new URL(seshyBookmark.url).searchParams.get('image') : null
		const tabs = bookmarks.filter(bookmark => bookmark !== seshyBookmark)

		return new ShelvedSession({
			bookmarkFolderId: bookmarkFolder.id,
			image,
			name: bookmarkFolder.title,
			tabs,
		})
	})
	return shelvedSessions
}

export async function getUnsavedSessions () {
	const windows = await getAllOpenWindows()
	const openSavedSessionWindowIds = await openSavedSessionTracker.getOpenSessionWindowIds()
	const windowsUnsaved = windows.filter(window => !openSavedSessionWindowIds.includes(window.id.toString()))

	return windowsUnsaved.map(window => new UnsavedSession({
		image: window.tabs[0].favIconUrl,
		name: window.tabs[0].title,
		tabs: window.tabs,
		windowId: window.id,
	}))
}

export async function getUnshelvedSessions () {
	const windows = await getAllOpenWindows()
	const openSavedSessionWindowIds = await openSavedSessionTracker.getOpenSessionWindowIds()
	const windowsUnshelved = windows.filter(window => openSavedSessionWindowIds.includes(window.id.toString()))
	const unshelvedSessionIdMappings = await localStorage.getAll() // TODO: Abstract this away into a higher-level module rather than calling localStorage directly

	const promises = windowsUnshelved.reverse().map(async window => {
		const bookmarkFolderId = unshelvedSessionIdMappings[window.id.toString()]
		const bookmarkFolder = await bookmarks.getFolder(bookmarkFolderId)

		return new UnshelvedSession({
			bookmarkFolderId: bookmarkFolder.id,
			image: window.tabs[0].favIconUrl,
			name: bookmarkFolder.title,
			tabs: window.tabs,
			windowId: window.id,
		})
	})

	return Promise.all(promises)
}

async function getAllOpenWindows () { // TODO: Extract to windows module
	return chrome.windows.getAll({populate: true, windowTypes: ['normal']})
}