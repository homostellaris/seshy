export function addKeyboardShortcuts () {
	document.addEventListener('keydown', (event) => {
		switch (event.key) {

		case '?':
			document.body.style.minHeight = '424px'
			document.dialog.open()
			break

		default: return // Exit this handler for other keys.
		}
		event.preventDefault() // Prevent the default action (scroll / move caret).
	})
}
