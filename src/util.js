/* global chrome */

/**
 * Utilities are simple functions that will naturally occur in both test and implementation when trying to avoid
 * duplication.
 * It therefore makes sense to take it one step further and eliminiate dupication further by having a single place for
 * such functions.
 */
export function asyncLoop (iterable, iterateFunction, callback) {
  var i = 0
  if (typeof i !== 'number') {
    throw new Error('Iterable must have an integer length.')
  }

  var iterate = () => {
    if (i === iterable.length) {
      callback()
    } else {
      iterateFunction(iterable[i++], iterate)
    }
  }

  // For each won't do anything if iterable length is 0 so just callback.
  iterate()
}

// TODO May be some weird edge cases where this returns true in undesirable circumstances.
// https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
export function isFunction (variable) {
  return typeof variable === 'function'
}

export function getSessionNameInput (session) {
  return session.element.getElementsByClassName('session-name-input')[0]
}

export function getCurrentlyOpenSessionElements () {
  var currentlyOpenSessionsList = document.getElementById('currently-open-sessions')
  var currentlyOpenSessionElements = currentlyOpenSessionsList.getElementsByClassName('session-card')
  return currentlyOpenSessionElements
}

export function checkIfSeshyFolderExists (callback) {
  console.log('Checking for existing Seshy folder...')

  var query = {
    'title': 'Seshy',
    'url': null
  }
  chrome.bookmarks.search(query, (bookmarkTreeNodes) => {
    if (bookmarkTreeNodes.length === 0) {
      console.log('No existing Seshy folder, creating...')
      this.createSeshyFolder()
    } else if (bookmarkTreeNodes.length === 1) {
      this.seshyFolderId = bookmarkTreeNodes[0].id
      console.log('Seshy folder already exists with ID ' + this.seshyFolderId + '.')
    } else {
      this.seshyFolderId = bookmarkTreeNodes[0].id
      console.error('More than one Session folder in Other Bookmarks!')
    }
  })
}
