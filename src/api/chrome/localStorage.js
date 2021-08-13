async function add (windowId, bookmarkFolderId) {
	await chrome.storage.local.set({[windowId]: bookmarkFolderId})
}

async function getAll () {
	const items = await new Promise(resolve => {
		chrome.storage.local.get(null, resolve)
	})
	return items || {}
}

async function remove (keys) {
	await new Promise(resolve => {
		chrome.storage.local.remove(keys, resolve)
	})
}

export default {
	add,
	getAll,
	remove,
}
