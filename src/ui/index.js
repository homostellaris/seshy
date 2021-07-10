import * as mdc from 'material-components-web'
import 'material-components-web/dist/material-components-web.css'
import './material-icons/index.css'

import './index.css'
import { addKeyboardShortcuts, initialiseKeyboardShortcutsDialog } from './keyboard-shortcuts/index.js'
import createSessionCards from './session-manager/createSessionCards.js'

(async function (){
	await createSessionCards()
	focusCurrentlyOpenSession()
	addKeyboardShortcuts()
	initialiseMaterialComponents()
	// initialiseKeyboardShortcutsDialog()
}())

function initialiseMaterialComponents () {
	mdc.autoInit()
}

async function focusCurrentlyOpenSession () {
	const currentlyOpenWindow = await chrome.windows.getCurrent(null)
	const sessionCard = document.querySelector(`[data-id="${currentlyOpenWindow.id}"]`)
	sessionCard.focus()
}
