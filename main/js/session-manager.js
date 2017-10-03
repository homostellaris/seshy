/* global mdc getAllOpenWindows getAllSessionFolders resumeSession */
setUp()

function setUp () {
  createSessionElements()
}

/**
 * Create all the HTML for sessions.
 */
function createSessionElements () {
  getAllOpenWindows((windows) => {
    appendSessions(windows, 'currently-open-sessions', true)
  })
  getAllSessionFolders((sessionFolders) => {
    appendSessions(sessionFolders, 'saved-sessions')
    window.mdc.autoInit()
    // addEventListeners()
  })
}

/**
 * Generate HTML for sessions and append them to their containers.
 */
function appendSessions (sessionFoldersOrWindows, listId, windows) {
  for (var i = 0; i < sessionFoldersOrWindows.length; i++) {
    var session = sessionFoldersOrWindows[i]
    var id = i
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
    sessionElement.innerHTML = getSessionInnerHtml(id, title, tabs)
    sessionList.appendChild(sessionElement)
  }
}

function addEventListeners () {
  var shelveButtons = document.getElementsByClassName('shelve')
  console.log(shelveButtons.length + ' shelve buttons found.')
  for (let i = 0; i < shelveButtons.length; i++) {
    var shelveButton = shelveButtons[i]
    shelveButton.addEventListener('click', () => {
      alert('Saving!')
      // resumeSession(session.id)
    })
  }

  var sessionNameFields = document.getElementsByClassName('session-name')
  for (let i = 0; i < sessionNameFields.length; i++) {
    var sessionNameField = sessionNameFields[i]
    sessionNameField.addEventListener('input', () => {
      alert('Saving new name!')
      // resumeSession(session.id)
    })
  }
}

/**
 * Get the HTML for a single session.
 */
function getSessionInnerHtml (id, title, tabs) {
  var innerHtml = `
    <span class="mdc-list-item__start-detail shelve">
      <i class="material-icons">backup</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="mdc-textfield" data-mdc-auto-init="MDCTextfield">
        <input id="session-name-input-${id}" class="mdc-textfield__input" type="text">
        <label class="mdc-textfield__label" for="session-name-input-${id}">Session Name</label>
      </div>
      <span class="mdc-list-item__text__secondary">
        ${tabs.length} tabs
      </span>
    </span>
    <span class="mdc-list-item__end-detail">
      <button>
        <i class="material-icons">open_in_new</i>
      </button>
    </span>
  `
  return innerHtml
}
