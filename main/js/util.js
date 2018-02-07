/**
 * Utilities are simple functions that will naturally occur in both test and implementation when trying to avoid
 * duplication.
 * It therefore makes sense to take it one step further and eliminiate dupication further by having a single place for
 * such functions.
 */
function asyncLoop (iterable, iterateFunction, callback) {
  var i = iterable.length
  if (typeof i !== 'number') {
    throw new Error('Iterable must have an integer length.')
  }

  var iterate = () => {
    if (i === 0) {
      callback()
    } else {
      iterateFunction(iterable[--i], iterate)
    }
  }

  // For each won't do anything if iterable length is 0 so just callback.
  iterate()
}

// TODO May be some weird edge cases where this returns true in undesirable circumstances.
// https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
function isFunction (variable) {
  return typeof variable === 'function'
}

function getSessionNameInput (session) {
  return session.element.getElementsByClassName('session-name-input')[0]
}

function getCurrentlyOpenSessionElements () {
  var currentlyOpenSessionsList = document.getElementById('currently-open-sessions')
  var currentlyOpenSessionElements = currentlyOpenSessionsList.getElementsByClassName('session-card')
  return currentlyOpenSessionElements
}
