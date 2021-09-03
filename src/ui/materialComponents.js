import './materialComponents.scss'
import {MDCList} from '@material/list'
import {MDCRipple} from '@material/ripple'
import {MDCTopAppBar} from '@material/top-app-bar';

import './materialIcons/index.css'

function init () {
	const topAppBarElement = document.querySelector('.mdc-top-app-bar')
	const topAppBar = new MDCTopAppBar(topAppBarElement)

	const list = new MDCList(document.querySelector('#sessions'))
	// list.singleSelection = true
	const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl))
}

export default {
	init,
}