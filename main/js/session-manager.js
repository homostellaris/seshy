/* global mdc getAllOpenWindows getAllSessionFolders resumeSession isFunction */

// ---===~ Classes ~===-------------------------------------------------------------------------------------------------
function Session (aWindow, bookmarkFolder) {
  this.name = bookmarkFolder ? bookmarkFolder.title : 'Unsaved Session'
  this.window = aWindow || null
  this.bookmarkFolder = bookmarkFolder || null
  this.tabs = aWindow ? aWindow.tabs : bookmarkFolder.children

  var listId = aWindow ? 'currently-open-sessions' : 'saved-sessions'
  var sessionList = document.getElementById(listId)

  var sessionElement = document.createElement('li')
  sessionElement.setAttribute('class', 'session-card mdc-list-item mdc-theme--background mdc-elevation--z2')
  sessionElement.innerHTML = getSessionInnerHtml(this.name, this.tabs)
  sessionList.appendChild(sessionElement)

  sessionElement.seshySession = this // So this created instance is always easily accessible.
  this.element = sessionElement

  Session.prototype.addEventListeners.call(this)
  // TODO Find out why this doesn't work. Throws syntax error because is not a function.
  // this.addEventListeners()
}

Session.prototype.currentlyOpen = function () {
  return Boolean(this.windowId)
}

Session.prototype.saved = function () {
  return Boolean(this.bookmarkFolderId)
}

Session.prototype.addEventListeners = function () {
  // var shelveButtons = document.getElementsByClassName('shelve')
  // console.log(shelveButtons.length + ' shelve buttons found.')
  // for (let i = 0; i < shelveButtons.length; i++) {
  //   var shelveButton = shelveButtons[i]
  //   shelveButton.addEventListener('click', () => {
  //     alert('Saving!')
  //     resumeSession(session.id)
  //   })
  // }

  var sessionNameInput = this.element.getElementsByClassName('session-name-input')[0]
  sessionNameInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) {
      alert('Saving new name!')
    }
  })
  sessionNameInput.addEventListener('focus', (event) => {
    var selectedSessions = document.getElementsByClassName('selected')
    for (var i = 0; i < selectedSessions.length; i++) {
      selectedSessions[i].classList.remove('selected')
    }
    this.element.classList.add('selected')
  })
}

// ---===~ Functions ~===-----------------------------------------------------------------------------------------------
function setUp (callback) {
  if (isFunction(callback)) {
    createSessionElements(callback)
  } else {
    createSessionElements()
  }
}

/**
 * Create all the HTML for sessions.
 */
function createSessionElements (callback) {
  getAllOpenWindows((windows) => {
    for (var i = 0; i < windows.length; i++) {
      /* eslint-disable no-new */
      new Session(windows[i], null)
      /* eslint-enable no-new */
    }
  })
  getAllSessionFolders((sessionFolders) => {
    for (var i = 0; i < sessionFolders.length; i++) {
      /* eslint-disable no-new */
      new Session(null, sessionFolders[i])
      /* eslint-enable no-new */
    }
    focusFirstSessionCard()
    window.mdc.autoInit()

    if (isFunction(callback)) callback()
  })
}

function focusFirstSessionCard () {
  console.log('Focusing first session card.')
  var firstSessionNameInput = document.getElementsByClassName('session-name-input')[0]
  firstSessionNameInput.focus()
}

/**
 * Get the HTML for a single session.
 */
function getSessionInnerHtml (title, tabs) {
  var innerHtml = `
    <span class="mdc-list-item__start-detail shelve">
      <i class="material-icons">backup</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="mdc-textfield mdc-textfield--dense">
        <input class="mdc-textfield__input session-name-input" type="text" placeholder="Unsaved Session">
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
