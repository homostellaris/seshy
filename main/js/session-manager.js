/* global mdc getAllOpenWindows getAllSessionFolders resumeSession isFunction done chrome saveSession */

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
  var sessionNameInput = this.element.getElementsByClassName('session-name-input')[0]

  sessionNameInput.addEventListener('focus', (event) => {
    console.log('Focus event handler triggered. Removing selected class from existing elements.')
    var selectedSessions = document.getElementsByClassName('selected')
    for (var i = 0; i < selectedSessions.length; i++) {
      selectedSessions[i].classList.remove('selected')
    }
    console.log('Adding selected class to focused element.')
    this.element.classList.add('selected')
    sessionNameInput.select()
  })
}

// ---===~ Functions ~===-----------------------------------------------------------------------------------------------
function setUp (callback) {
  var done = () => {
    addKeyboardShortcuts()
    window.mdc.autoInit()
    if (isFunction(callback)) callback()
  }
  createSessionElements(done)
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
      if (i === windows.length - 1) {
        focusCurrentlyOpenSession(callback)
      }
    }
  })
  getAllSessionFolders((sessionFolders) => {
    for (var i = 0; i < sessionFolders.length; i++) {
      /* eslint-disable no-new */
      new Session(null, sessionFolders[i])
      /* eslint-enable no-new */
    }
  })
}

function focusCurrentlyOpenSession (callback) {
  console.log('Focusing currently open session.')
  var focusSessionNameInput = (currentlyOpenWindow) => {
    var currentlyOpenSessionList = getSessionLists()[0]
    var sessions = getSessionsFromSessionList(currentlyOpenSessionList)

    for (var i = 0; i < sessions.length; i++) {
      var session = sessions[i]
      if (currentlyOpenWindow.id === session.seshySession.window.id) {
        var currentlyOpenSessionNameInput = getSessionNameInput(session)
        currentlyOpenSessionNameInput.focus()
        if (isFunction(callback)) callback()
      }
    }
  }

  chrome.windows.getCurrent(null, focusSessionNameInput)
}

/**
 * Get the HTML for a single session.
 */
function getSessionInnerHtml (title, tabs) {
  var innerHtml = `
    <span class="mdc-list-item__start-detail shelve">
      <i class="saved-state-icon material-icons">backup</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="mdc-textfield mdc-textfield--dense">
        <input class="mdc-textfield__input session-name-input" type="text" value="${title}">
      </div>
      <span class="mdc-list-item__text__secondary">
        ${tabs.length} tabs
      </span>
    </span>
    <span class="mdc-list-item__end-detail">
      <button>
        <i class="unshelve-icon material-icons">open_in_new</i>
      </button>
    </span>
  `
  return innerHtml
}

function addKeyboardShortcuts () {
  document.addEventListener('keydown', (event) => {
    console.log('Keydown event triggered.')
    switch (event.keyCode) {
      case 13: // `ENTER` key.
        var callSaveSession = () => {
          var selectedSession = getSelectedSession()
          var selectedSessionWindowId = selectedSession.seshySession.window.id
          saveSession(selectedSessionWindowId, () => {
            alert('SAVED!')
          })
        }
        callSaveSession()
        break

      case 37: // `LEFT` arrow key.
        selectLastSessionInPreviousSessionList()
        break

      case 38: // `UP` arrow key.
        selectPreviousSession()
        break

      case 39: // `RIGHT` arrow key.
        selectFirstSessionInNextSessionList()
        break

      case 40: // `DOWN` arrow key.
        selectNextSession()
        break

      default: return // exit this handler for other keys
    }
    event.preventDefault() // prevent the default action (scroll / move caret)
  })
}

function selectNextSession () {
  var session = getNextSession()
  if (session === null) {
    selectFirstSessionInNextSessionList()
  } else {
    var sessionNameInput = getSessionNameInput(session)
    sessionNameInput.focus()
  }
}

function selectPreviousSession () {
  var session = getPreviousSession()
  if (session === null) {
    selectLastSessionInPreviousSessionList()
  } else {
    var sessionNameInput = getSessionNameInput(session)
    sessionNameInput.focus()
  }
}

function selectFirstSessionInNextSessionList () {
  var nextSessionList = getNextSessionList()
  var firstSessionInNextSessionList = getSessionsFromSessionList(nextSessionList)[0]
  var sessionNameInput = getSessionNameInput(firstSessionInNextSessionList)
  sessionNameInput.focus()
}

function selectLastSessionInPreviousSessionList () {
  var previousSessionList = getPreviousSessionList()
  var sessions = getSessionsFromSessionList(previousSessionList)
  var lastSessionInPreviousSessionList = sessions[sessions.length - 1]
  var sessionNameInput = getSessionNameInput(lastSessionInPreviousSessionList)
  sessionNameInput.focus()
}

function getSelectedSession () {
  return document.getElementsByClassName('selected')[0]
}

function getSessionNameInput (session) {
  return session.getElementsByClassName('session-name-input')[0]
}

function getSelectedSessionNameInput () {
  var selectedSession = getSelectedSession()
  var selectedSessionNameInput = getSessionNameInput(selectedSession)
  return selectedSessionNameInput
}

function getNextSession () {
  var session = getSelectedSession()
  return session.nextElementSibling
}

function getPreviousSession () {
  var session = getSelectedSession()
  return session.previousElementSibling
}

function getNextSessionList () {
  var currentlySelectedSession = getSelectedSession()
  var currentSessionList = currentlySelectedSession.parentElement
  var sessionLists = getSessionLists()

  for (var i = 0; i < sessionLists.length; i++) {
    var sessionList = sessionLists[i]
    if (sessionList === currentSessionList) {
      var nextSessionListIndex = ++i % sessionLists.length
    }
  }

  return sessionLists[nextSessionListIndex]
}

function getPreviousSessionList () {
  var currentlySelectedSession = getSelectedSession()
  var currentSessionList = currentlySelectedSession.parentElement
  var sessionLists = getSessionLists()

  for (var i = 0; i < sessionLists.length; i++) {
    var sessionList = sessionLists[i]
    if (sessionList === currentSessionList) {
      var previousSessionListIndex = (sessionLists.length + --i) % sessionLists.length
      break // Otherwise infinite loop.
    }
  }

  return sessionLists[previousSessionListIndex]
}

function getSessionLists () {
  return document.getElementsByClassName('session-list')
}

function getSessionsFromSessionList (sessionList) {
  return sessionList.getElementsByClassName('session-card')
}
