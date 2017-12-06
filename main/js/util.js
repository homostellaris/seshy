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
