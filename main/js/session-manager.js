/* global mdc getAllOpenWindows getAllSessionFolders resumeSession isFunction done chrome saveSession deleteSession
asyncLoop renameSession getSessionNameInput */

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

  var tabsNumber = aWindow ? aWindow.tabs.length : bookmarkFolder.children.length
  sessionElement.innerHTML = getSessionInnerHtml(this.name, tabsNumber, this.saved())
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
  var session = this
  function setWindowAndCallback (updatedWindow) {
    session.window = updatedWindow
    callback(updatedWindow)
  }

  chrome.windows.get(this.window.id, {populate: true}, setWindowAndCallback)
}

Session.prototype.updateBookmarkFolder = function (callback) {
  var setBookmarkFolderAndCallback = (bookmarkTreeNodes) => {
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

  this.element.addEventListener('click', (event) => {
    var classList = event.target.classList
    if (classList.contains('edit-icon')) {
      if (sessionIsBeingRenamed(event.target)) {
        finishEditingSession(this)
      } else {
        startEditingSession(this)
      }
    } else if (classList.contains('resume-icon')) {
      resumeSession(this)
    } else if (classList.contains('delete-icon')) {
      deleteSelectedSession()
    }
  })

  this.keydownEventListener = (event) => {
    switch (event.key) {
      case 'r':
        startEditingSession(this)
        break

      case '#':
        deleteSelectedSession()
        break

      default: return
    }
    event.preventDefault()
  }

  this.enterKeydownEventListener = (event) => {
    if (event.key === 'Enter') {
      if (sessionIsBeingRenamed(event.target)) {
        finishEditingSession(this)
        event.stopPropagation()
      } else {
        resumeSelectedSession()
        event.stopPropagation()
      }
    }
  }

  this.element.addEventListener('keydown', this.enterKeydownEventListener)
  this.element.addEventListener('keydown', this.keydownEventListener)
}

/**
 * Pass a truthy value to set saved state icon to 'saved' or a falsey value to set it to 'unsaved'.
 */
Session.prototype.setSavedIconState = function (savedBoolean) {
  var savedStateIcon = this.element.getElementsByClassName('saved-state-icon')[0]
  if (savedBoolean) {
    savedStateIcon.textContent = 'bookmark'
  } else {
    savedStateIcon.textContent = 'bookmark_border'
  }
}

// ---===~ Functions ~===-----------------------------------------------------------------------------------------------
function setUp (callback) {
  var done = () => {
    addKeyboardShortcuts()
    window.mdc.autoInit()
    if (isFunction(callback)) callback()
  }
  createSessionElements(() => {
    focusCurrentlyOpenSession(done)
  })
  initialiseKeyboardShortcutsDialog()
}

function initialiseKeyboardShortcutsDialog() {
  this.dialog = new mdc.dialog.MDCDialog(document.querySelector('#keyboard-shortcuts'))
  this.dialog.listen('MDCDialog:accept', () => {
    document.body.style.minHeight = 'initial'
  })
}

/**
 * Create session cards to populate session lists.
 */
function createSessionElements (callback) {
  var createCurrentlyOpenSessions = (storageObject) => {
    getAllOpenWindows((windows) => {
      createSessionsFromWindows(windows, storageObject)
    })
  }

  var createSessionsFromWindows = (windows, storageObject) => {
    var createSession = (sessionWindow, callback) => {
      var bookmarkFolderId = storageObject[sessionWindow.id.toString()]
      var bookmarkFolder = null

      if (typeof bookmarkFolderId === 'undefined') {
        createSessionObjectThenCallback(sessionWindow, bookmarkFolder, callback)
      } else {
        chrome.bookmarks.getSubTree(bookmarkFolderId, (bookmarkFolders) => {
          var bookmarkFolder = bookmarkFolders[0]
          createSessionObjectThenCallback(sessionWindow, bookmarkFolder, callback)
        })
      }
    }

    asyncLoop(windows, createSession, () => {
      createShelvedSessions(storageObject)
    })
  }

  var createSessionObjectThenCallback = (sessionWindow, bookmarkFolder, callback) => {
    /* eslint-disable no-new */
    new Session(sessionWindow, bookmarkFolder)
    /* eslint-enable no-new */
    callback()
  }

  var createShelvedSessions = (storageObject) => {
    getAllSessionFolders((bookmarkFolders) => {
      var shelvedSessionBookmarkFolderIds = Object.values(storageObject)

      var createShelvedSession = (bookmarkFolder, callback) => {
        // If the bookmarkFolderId is in the winow to bookmark folder mapping then it is a currently open session and
        // we do not want to duplicate it.
        if (!shelvedSessionBookmarkFolderIds.includes(bookmarkFolder.id)) {
          /* eslint-disable no-new */
          new Session(null, bookmarkFolder)
          /* eslint-enable no-new */
        }
        callback()
      }
      asyncLoop(bookmarkFolders, createShelvedSession, callback)
    })
  }

  chrome.storage.local.get(null, createCurrentlyOpenSessions)
}

function focusCurrentlyOpenSession (callback) {
  console.log('Focusing currently open session.')
  var focusSessionElement = (currentlyOpenWindow) => {
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

  chrome.windows.getCurrent(null, focusSessionElement)
}

/**
 * Get the HTML for a single session.
 */
function getSessionInnerHtml (title, tabsNumber, saved) {
  var savedStateIcon = saved ? 'bookmark' : 'bookmark_border'
  var innerHtml = `
    <span class="mdc-list-item__graphic">
      <button title="saved state">
        <i class="saved-state-icon material-icons">${savedStateIcon}</i>
      </button>
    </span>
    <span class="mdc-list-item__text">
      <div class="session-name mdc-text-field mdc-text-field--dense mdc-text-field--fullwidth">
        <input type="text" class="session-name-input mdc-text-field__input" value="${title}" readonly="true">
        <div class="mdc-line-ripple"></div>
      </div>
      <span class="tabs-number mdc-list-item__secondary-text">
        ${tabsNumber} tabs
      </span>
    </span>
    <span class="mdc-list-item__meta">
      <button class="edit-button" title="edit">
        <i class="edit-icon material-icons">edit</i>
      </button>
      <button class="resume-button" title="resume">
        <i class="resume-icon material-icons">open_in_new</i>
      </button>
      <button class="delete-button" title="delete">
        <i class="delete-icon material-icons">delete</i>
      </button>
    </span>
  `
  return innerHtml
}

function addKeyboardShortcuts () {
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        selectLastSessionInPreviousSessionList()
        break

      case 'ArrowUp':
        selectPreviousSession()
        break

      case 'ArrowRight':
        selectFirstSessionInNextSessionList()
        break

      case 'ArrowDown':
        selectNextSession()
        break

      case '?':
        document.body.style.minHeight = '424px'
        this.dialog.show()
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
  // Check if focused element is a session-card. Could be a session-name-input for example.
  var element = document.activeElement
  if (element.classList.contains('session-card')) {
    return document.activeElement
  }
  for (var i = 0; i < 10; i++) {
    element = element.parentElement
    if (element.classList.contains('session-card')) {
      return element
    }
  }
  throw Error(`Save was called with unexpected element ${document.activeElement.tagName} focused.`)
}

function getSelectedSessionNameInput () {
  var selectedSession = getSelectedSession()
  var selectedSessionNameInput = getSessionNameInput(selectedSession.seshySession)
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

function focusSessionNameInput () {
  var sessionElement = getSelectedSession()
  var sessionNameInput = getSessionNameInput(sessionElement.seshySession)
  sessionNameInput.select()
}

function saveSelectedSession (callback) {
  var updateSavedStateIcon = () => {
    session.setSavedIconState(true)
    if (isFunction(callback)) callback()
  }

  var selectedSessionElement = getSelectedSession()
  var sessionNameInput = getSessionNameInput(selectedSessionElement.seshySession)
  var session = selectedSessionElement.seshySession

  session.name = sessionNameInput.value // Session instance was created before name input text changed so must update.
  saveSession(session, updateSavedStateIcon)
}

function renameSelectedSession (callback) {
  var selectedSessionElement = getSelectedSession()
  var sessionNameInput = getSessionNameInput(selectedSessionElement.seshySession)
  var newName = sessionNameInput.value
  var session = selectedSessionElement.seshySession

  if (isFunction(callback)) {
    renameSession(session, newName, callback)
  } else {
    renameSession(session, newName)
  }
}

function resumeSelectedSession (callback) {
  var selectedSessionElement = getSelectedSession()

  if (isFunction(callback)) {
    resumeSession(selectedSessionElement.seshySession, callback)
  } else {
    resumeSession(selectedSessionElement.seshySession)
  }
}

function sessionIsBeingRenamed (element) {
  var editIcon
  if (element.classList.contains('edit-icon')) {
    editIcon = element
  } else {
    editIcon = getSelectedSession().getElementsByClassName('edit-icon')[0]
  }
  return Boolean(editIcon.textContent === 'done')
}

function deleteSelectedSession (callback) {
  var focusNextSessionCardThenCallback = () => {
    nextSessionCard.focus()
    if (isFunction(callback)) callback()
  }

  var nextSessionCard = getNextSession()
  var selectedSessionElement = getSelectedSession()
  deleteSession(selectedSessionElement.seshySession, focusNextSessionCardThenCallback)
}

function startEditingSession (session, callback) {
  session.element.removeEventListener('keydown', session.keydownEventListener)
  var sessionNameInput = session.element.getElementsByClassName('session-name-input')[0]
  sessionNameInput.readOnly = false
  sessionNameInput.select()
  var editIcon = session.element.getElementsByClassName('edit-icon')[0]
  changeEditIconToConfirmEditIcon(editIcon)
  if (isFunction(callback)) callback()
}

function finishEditingSession (session, callback) {
  var updateUiState = () => {
    session.element.addEventListener('keydown', session.keydownEventListener)
    var sessionNameInput = session.element.getElementsByClassName('session-name-input')[0]
    sessionNameInput.readOnly = true
    var editIcon = session.element.getElementsByClassName('edit-icon')[0]
    changeConfirmEditIconBackToEditIcon(editIcon)
    if (isFunction(callback)) callback()
  }

  finishRenamingSession(session, updateUiState)
}

function finishRenamingSession (session, callback) {
  if (session.saved()) {
    console.warn('Renaming selected session.')
    renameSelectedSession()
  } else {
    console.warn('Saving selected session.')
    saveSelectedSession()
  }
  if (isFunction(callback)) callback()
}

function changeEditIconToConfirmEditIcon (editIcon) {
  editIcon.textContent = 'done'
  editIcon.style.color = '#4CAF50'
}

function changeConfirmEditIconBackToEditIcon (editIcon) {
  editIcon.textContent = 'edit'
  editIcon.style.color = '#000'
}
