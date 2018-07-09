/* global chrome mdc */

import { BookmarkPersistenceManager } from '/js/persistence.js'
import { asyncLoop, isFunction, getSessionNameInput } from '/js/util.js'
import { Session } from '/js/session.js'

var bookmarkPersistenceManager = new BookmarkPersistenceManager()

export function setUp (callback) {
  var done = () => {
    if (isFunction(callback)) callback()
  }

  var callAddKeyboardShortcuts = () => {
    addKeyboardShortcuts(initialiseMaterialComponents)
  }

  var initialiseMaterialComponents = () => {
    window.mdc.autoInit()
    initialiseKeyboardShortcutsDialog(done)
  }

  createSessionElements(() => {
    focusCurrentlyOpenSession(callAddKeyboardShortcuts)
  })
}

function initialiseKeyboardShortcutsDialog (callback) {
  var keyboardShortcutsElement = document.querySelector('#keyboard-shortcuts')
  document.dialog = new mdc.dialog.MDCDialog(keyboardShortcutsElement)
  document.dialog.listen('MDCDialog:accept', () => {
    document.body.style.minHeight = 'initial'
  })
  if (isFunction(callback)) callback()
}

/**
 * Create session cards to populate session lists.
 */
function createSessionElements (callback) {
  var createCurrentlyOpenSessions = (storageObject) => {
    chrome.windows.getAll({'populate': true}, (windows) => {
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
    bookmarkPersistenceManager.getAllSessionFolders((bookmarkFolders) => {
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

export function addKeyboardShortcuts (callback) {
  document.keydownEventListener = (event) => {
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
        document.dialog.show()
        break

      default: return // exit this handler for other keys
    }
    event.preventDefault() // prevent the default action (scroll / move caret)
  }

  document.addEventListener('keydown', document.keydownEventListener)

  if (isFunction(callback)) callback()
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

export function getPreviousSession () {
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
