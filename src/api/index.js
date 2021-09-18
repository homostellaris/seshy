import diff from 'hyperdiff'
import bookmarks from './chrome/bookmarks'
import localStorage from './chrome/localStorage.js'
import openSavedSessionTracker from './openSavedSessionTracker/index.js'
import {ShelvedSession, UnsavedSession, UnshelvedSession} from './session'

export async function persistSession (windowId, bookmarkFolderId) {
	const window = await chrome.windows.get(windowId, {populate: true})
	const [bookmarkFolder] = await chrome.bookmarks.getSubTree(bookmarkFolderId)

	const imageTab = getImageTab(window)
	const windowTabsWithImage = [...window.tabs]
	windowTabsWithImage.unshift(imageTab)

	const {added, removed, common} = diff(bookmarkFolder.children || [], windowTabsWithImage || [], 'url')

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
			{index: tab.index}),
		)

	await Promise.all([
		...createOperations,
		...removeOperations,
		...moveOperations,
	])
}

function getImageTab(window) {
	const image = window.tabs[0].favIconUrl
	const url = new URL(`seshy:///?image=${image}`).toString()
	return {
		index: 0,
		title: '.seshy',
		url,
	}
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