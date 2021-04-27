function saved () {
	chrome.action.setIcon({path: '../status/saved.png'})
}

function saving () {
	chrome.action.setIcon({path: '../status/saving.png'})
}

function unsaved () {
	chrome.action.setIcon({path: '../status/unsaved.png'})
}

export default {
	saved,
	saving,
	unsaved,
}