/* global mdc getAllOpenWindows getAllSessionFolders resumeSession */
setUp()
mdc.autoInit()

function setUp () {
  createSessionElements()
}

/**
 * Create all the HTML for sessions.
 */
function createSessionElements () {
  getAllOpenWindows((windows) => {
    console.log(windows)
    appendSessions(windows, 'currently-open-sessions', true)
  })
  getAllSessionFolders((sessionFolders) => {
    appendSessions(sessionFolders, 'saved-sessions')
  })
}

/**
 * Generate HTML for sessions and append them to their containers.
 */
function appendSessions (sessionFoldersOrWindows, listId, windows) {
  for (var i = 0; i < sessionFoldersOrWindows.length; i++) {
    var session = sessionFoldersOrWindows[i]
    var title
    var tabs

    if (windows === true) {
      title = 'Unsaved Session'
      tabs = session.tabs
    } else {
      title = session.title
      tabs = session.children
    }

    var sessionList = document.getElementById(listId)
    var sessionElement = document.createElement('li')
    sessionElement.setAttribute('class', 'session mdc-list-item mdc-theme--background mdc-elevation--z2')
    sessionElement.innerHTML = getSessionInnerHtml(title, tabs)

    if (windows !== true) {
      sessionElement.addEventListener('click', () => {
        resumeSession(session.id)
      })
    }
    sessionList.appendChild(sessionElement)
  }
}

/**
 * Get the HTML for a single session.
 */
function getSessionInnerHtml (title, tabs) {
  var innerHtml = '<span class="mdc-list-item__start-detail">' +
    '<i class="material-icons">backup</i>' +
    '</span>' +
    '<span class="mdc-list-item__text" contenteditable="true">' +
    title +
    '<span class="mdc-list-item__text__secondary">' +
    tabs.length + ' tabs' +
    '</span>' +
    '</span>' +
    '<span class="mdc-list-item__end-detail">' +
    '<button>' +
    '<i class="material-icons">open_in_new</i>' +
    '</button>' +
    '</span>'
  return innerHtml
}
