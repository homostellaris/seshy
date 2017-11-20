/* global mdc getAllOpenWindows getAllSessionFolders resumeSession isFunction done chrome saveSession */

// ---===~ Classes ~===-------------------------------------------------------------------------------------------------
function Session (aWindow, bookmarkFolder) {
  if (!aWindow && !bookmarkFolder) {
    throw Error('A session must have either a window or a bookmarks folder.')
  }

  this.name = bookmarkFolder ? bookmarkFolder.title : 'Unsaved Session'
  this.window = aWindow || null
  this.bookmarkFolder = bookmarkFolder || null
  // this.tabs = aWindow ? aWindow.tabs : bookmarkFolder.children

  var listId = aWindow ? 'currently-open-sessions' : 'saved-sessions'
  var sessionList = document.getElementById(listId)

  var sessionElement = document.createElement('li')
  sessionElement.setAttribute('class', 'session-card mdc-list-item mdc-theme--background mdc-elevation--z2')
  sessionElement.setAttribute('tabindex', '0') // Make `li` element focusable.
  sessionElement.innerHTML = getSessionInnerHtml(this.name, this.tabs)
  sessionList.appendChild(sessionElement)

  sessionElement.seshySession = this // So this created instance is always easily accessible.
  this.element = sessionElement

  Session.prototype.addEventListeners.call(this)
  // TODO Find out why this doesn't work. Throws syntax error because is not a function.
  // this.addEventListeners()
}

Session.prototype.currentlyOpen = function () {
  return Boolean(this.window)
}

Session.prototype.saved = function () {
  return Boolean(this.bookmarkFolder)
}

Session.prototype.updateWindow = function (callback) {
  function setWindowAndCallback (updatedWindow) {
    this.window = updatedWindow
    callback(updatedWindow)
  }

  chrome.windows.get(this.window.id, {populate: true}, setWindowAndCallback)
}

Session.prototype.updateBookmarkFolder = function (callback) {
  function setBookmarkFolderAndCallback (bookmarkTreeNodes) {
    this.bookmarkFolder = bookmarkTreeNodes[0]
    callback(this.bookmarkFolder)
  }

  chrome.bookmarks.getSubTree(this.bookmarkFolder.id, setBookmarkFolderAndCallback)
}

Session.prototype.addEventListeners = function () {
  this.element.addEventListener('focus', (event) => {
    console.log('Focus event handler triggered. Removing selected class from existing elements.')
    var selectedSessions = document.getElementsByClassName('selected')
    for (var i = 0; i < selectedSessions.length; i++) {
      selectedSessions[i].classList.remove('selected')
    }
    console.log('Adding selected class to focused element.')
    this.element.classList.add('selected')
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
    var sessionElements = getSessionsFromSessionList(currentlyOpenSessionList)

    for (var i = 0; i < sessionElements.length; i++) {
      var sessionElement = sessionElements[i]
      if (currentlyOpenWindow.id === sessionElement.seshySession.window.id) {
        // var currentlyOpenSessionNameInput = getSessionNameInput(session)
        // currentlyOpenSessionNameInput.focus()
        sessionElement.focus()
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
  var numberOfTabs = 0
  if (tabs) numberOfTabs = tabs.length
  var innerHtml = `
    <span class="mdc-list-item__start-detail shelve">
      <i class="saved-state-icon material-icons">backup</i>
    </span>
    <span class="mdc-list-item__text">
      <div class="mdc-textfield mdc-textfield--dense">
        <input class="mdc-textfield__input session-name-input" type="text" value="${title}">
      </div>
      <span class="mdc-list-item__text__secondary">
        ${numberOfTabs} tabs
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
        saveSelectedSession()
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

      case 82: // `r` key.
        focusSessionNameInput(event)
        break

      default: return // exit this handler for other keys
    }
    event.preventDefault() // prevent the default action (scroll / move caret)
  })
}

function selectNextSession () {
  var sessionElement = getNextSession()
  if (sessionElement === null) {
    selectFirstSessionInNextSessionList()
  } else {
    sessionElement.focus()
  }
}

function selectPreviousSession () {
  var sessionElement = getPreviousSession()
  if (sessionElement === null) {
    selectLastSessionInPreviousSessionList()
  } else {
    sessionElement.focus()
  }
}

function selectFirstSessionInNextSessionList () {
  var nextSessionList = getNextSessionList()
  var firstSessionInNextSessionList = getSessionsFromSessionList(nextSessionList)[0]
  firstSessionInNextSessionList.focus()
}

function selectLastSessionInPreviousSessionList () {
  var previousSessionList = getPreviousSessionList()
  var sessions = getSessionsFromSessionList(previousSessionList)
  var lastSessionInPreviousSessionList = sessions[sessions.length - 1]
  lastSessionInPreviousSessionList.focus()
}

function getSelectedSession () {
  return document.getElementsByClassName('selected')[0]
}

function getSessionNameInput (sessionElement) {
  return sessionElement.getElementsByClassName('session-name-input')[0]
}

function getSelectedSessionNameInput () {
  var selectedSession = getSelectedSession()
  var selectedSessionNameInput = getSessionNameInput(selectedSession)
  return selectedSessionNameInput
}

function getNextSession () {
  var sessionElement = getSelectedSession()
  return sessionElement.nextElementSibling
}

function getPreviousSession () {
  var sessionElement = getSelectedSession()
  return sessionElement.previousElementSibling
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

function focusSessionNameInput (event) {
  var sessionElement = event.srcElement
  var sessionNameInput = getSessionNameInput(sessionElement)
  sessionNameInput.select()
}

function saveSelectedSession () {
  var selectedSessionElement = getSelectedSession()
  var sessionNameInput = getSessionNameInput(selectedSessionElement)
  var session = selectedSessionElement.seshySession

  session.name = sessionNameInput.value // Session instance was created before name input text changed so must update.

  saveSession(session, () => {
    setSavedIconToSavedState(selectedSessionElement)
  })
}

function setSavedIconToSavedState (sessionElement) {
  var savedStateIcon = sessionElement.getElementsByClassName('saved-state-icon')[0]
  savedStateIcon.style.color = 'royalblue'
}
