import './index.css'
import {
	addKeyboardShortcuts,
} from './keyboardShortcuts/index.js'
import materialComponents from './materialComponents'
import createSessionCards from './SessionManager/createSessionCards.js'

(async function () {
	await createSessionCards()
	materialComponents.init()
	addKeyboardShortcuts()
}())
