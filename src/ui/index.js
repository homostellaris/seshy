import './index.css'
import {
	addKeyboardShortcuts,
	initialiseKeyboardShortcutsDialog,
} from './keyboardShortcuts/index.js'
import materialComponents from './materialComponents'
import createSessionCards from './SessionManager/createSessionCards.js'

(async function () {
	await createSessionCards()
	focusCurrentlyOpenSession()
	addKeyboardShortcuts()
	materialComponents.init()
	initialiseKeyboardShortcutsDialog()
}())

async function focusCurrentlyOpenSession () {
	const currentlyOpenWindow = await chrome.windows.getCurrent(null)
	const sessionCard = document.querySelector(`[data-window-id="${currentlyOpenWindow.id}"]`)
	sessionCard.focus()
}
