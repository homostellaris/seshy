import './index.css'
import {
	addKeyboardShortcuts,
	initialiseKeyboardShortcutsDialog,
} from './keyboardShortcuts/index.js'
import materialComponents from './materialComponents'
import createSessionCards from './SessionManager/createSessionCards.js'

(async function () {
	await createSessionCards()
	addKeyboardShortcuts()
	materialComponents.init()
	initialiseKeyboardShortcutsDialog()
}())
