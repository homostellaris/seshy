async function createFolder (name) {
	const seshyFolder = await getSeshyFolder() // TODO: Just get this once on extension startup?
	const folder = await chrome.bookmarks.create({
		parentId: seshyFolder.id,
		title: name,
		url: null, // This makes it a folder rather than a regular bookmark.
	})
	return folder
}

async function createSeshyFolder () {
	let seshyFolder = await getSeshyFolder()
	if (!seshyFolder) {
		// Defaults to creating in the "Other Bookmarks" folder.
		seshyFolder = await chrome.bookmarks.create({
			title: 'Seshy',
			url: null, // This makes it a folder rather than a regular bookmark.
		})
	}
	return seshyFolder
}

async function getAllFolders () {
	const seshyFolder = await getSeshyFolder()
	const seshyFolderSubtree = await chrome.bookmarks.getSubTree(seshyFolder.id)
	const bookmarkFolders = seshyFolderSubtree[0].children
		.filter(bookmarkFolder => !isSystemFolder(bookmarkFolder))
	return bookmarkFolders
}

function isSystemFolder (bookmarkFolder) {
	return new RegExp('^_').test(bookmarkFolder.title)
}

async function getFolder (bookmarkFolderId) {
	const [bookmarkFolder] = await chrome.bookmarks.getSubTree(bookmarkFolderId)
	return bookmarkFolder
}

async function getSeshyFolder () {
	const bookmarkTreeNodes = await chrome.bookmarks.search({title: 'Seshy'})
	if (bookmarkTreeNodes.length > 1) throw new Error('There is more than one Seshy folder, please remove one.')
	return bookmarkTreeNodes.length ? bookmarkTreeNodes[0] : null
}

export default {
	createFolder,
	createSeshyFolder,
	getAllFolders,
	getFolder,
	getSeshyFolder,
}
