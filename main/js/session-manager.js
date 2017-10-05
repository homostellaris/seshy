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
    focusFirstSessionCard()
    addEventListeners()
    window.mdc.autoInit()
  })
}

/**
 * Generate HTML for sessions and append them to their containers.
 */
function appendSessions (sessionFoldersOrWindows, listId, windows) {
  for (var i = 0; i < sessionFoldersOrWindows.length; i++) {
    var session = sessionFoldersOrWindows[i]
    var id = i + 1
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
    sessionElement.setAttribute('class', 'session-card mdc-list-item mdc-theme--background mdc-elevation--z2')
    sessionElement.innerHTML = getSessionInnerHtml(id, title, tabs)
    sessionList.appendChild(sessionElement)
  }
}

function focusFirstSessionCard () {
  var firstSessionCard = document.getElementById('session-name-input-1')
  firstSessionCard.setAttribute('autofocus', '')
}

function addEventListeners () {
  // var shelveButtons = document.getElementsByClassName('shelve')
  // console.log(shelveButtons.length + ' shelve buttons found.')
  // for (let i = 0; i < shelveButtons.length; i++) {
  //   var shelveButton = shelveButtons[i]
  //   shelveButton.addEventListener('click', () => {
  //     alert('Saving!')
  //     resumeSession(session.id)
  //   })
  // }

  var sessionNameInputs = document.getElementsByClassName('session-name-input')
  for (let i = 0; i < sessionNameInputs.length; i++) {
    var sessionNameInput = sessionNameInputs[i]
    sessionNameInput.addEventListener('keydown', (event) => {
      if (event.keyCode === 13) {
        alert('Saving new name!')
      }
    })
    sessionNameInput.addEventListener('focus', (event) => {
      console.log('focused')
      var firstSessionCard = document.getElementsByClassName('session-card')[0]
      if (firstSessionCard) {
        console.log('applying class')
        firstSessionCard.classList.add('selected')
      }
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
      <div class="mdc-textfield mdc-textfield--dense">
        <input id="session-name-input-${id}" class="mdc-textfield__input session-name-input" type="text" placeholder="Unsaved Session">
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
