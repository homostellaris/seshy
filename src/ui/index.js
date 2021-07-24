import 'material-components-web/dist/material-components-web.css'
import './materialIcons/index.css'

import './index.css'
import {
	addKeyboardShortcuts,
	// initialiseKeyboardShortcutsDialog
} from './keyboard-shortcuts/index.js'
import {
	// focusCurrentlyOpenSession,
	initialiseMaterialComponents,
} from './SessionManager/index.js'
import createSessionCards from './SessionManager/createSessionCards.js'

(async function () {
	await createSessionCards()
	// focusCurrentlyOpenSession()
	addKeyboardShortcuts()
	initialiseMaterialComponents()
	// initialiseKeyboardShortcutsDialog()
}())
