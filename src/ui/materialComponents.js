import './materialComponents.scss'
import './materialIcons/index.css'
import {MDCDialog} from '@material/dialog'
import {MDCList} from '@material/list'
import {MDCRipple} from '@material/ripple'
import {MDCTopAppBar} from '@material/top-app-bar'

import SessionManager from './SessionManager'

function init () {
	initTopAppbar()
	const list = initList()
	initKeyboardShortcutsDialog()
	return list
}

function initList () {
	const list = new MDCList(document.querySelector('#sessions'))
	list.singleSelection = true
	list.listElements.map((listItemEl) => new MDCRipple(listItemEl))
	list.listen('MDCList:action', event => {
		const listItemIndex = event.detail.index
		const sessionCard = list.listElements[listItemIndex]
		const sessionManager = SessionManager.factory(sessionCard)
		sessionManager.resume()
	})
}

function initTopAppbar () {
	const topAppBarElement = document.querySelector('.mdc-top-app-bar')
	new MDCTopAppBar(topAppBarElement)
}

function initKeyboardShortcutsDialog () {
	const keyboardShortcutsElement = document.querySelector('#keyboard-shortcuts')
	document.dialog = new MDCDialog(keyboardShortcutsElement)
	document.dialog.listen('MDCDialog:accept', () => {
		document.body.style.minHeight = 'initial'
	})
}

export default {
	init,
}