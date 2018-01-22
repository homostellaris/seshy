/**
 * Utilities are simple functions that will naturally occur in both test and implementation when trying to avoid
 * duplication.
 * It therefore makes sense to take it one step further and eliminiate dupication further by having a single place for
 * such functions.
 */
function asyncLoop (iterable, iterateFunction, callback) {
  var i = iterable.length
  var returnIfFinished = () => {
    if (i <= 1) {
      callback()
    }
    i--
  }
  var iterate = (element) => {
    iterateFunction(element, returnIfFinished)
  }
  // For each won't do anything if iterable length is 0 so just callback.
  if (i === 0) {
    callback()
  } else {
    iterable.forEach(iterate)
  }
}

// TODO May be some weird edge cases where this returns true in undesirable circumstances.
// https://stackoverflow.com/questions/5999998/how-can-i-check-if-a-javascript-variable-is-function-type
function isFunction (variable) {
  return typeof variable === 'function'
}

function getSessionNameInput (session) {
  return session.element.getElementsByClassName('session-name-input')[0]
}
