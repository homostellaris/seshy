// TODO: Return a bunch of test data and consider using a mock Chrome library.
const fakeChrome = {
    bookmarks: {
        search: () => null
    },
    storage: {
        local: {
            get: () => null
        }       
    }
}

if (window.chrome.bookmarks === undefined) {
    console.info('In a Node env so using a fake chrome object for basic checking that the extension hangs together.')
} else {
    console.info('Exporting real Chrome object found on window.')
}

export default window.chrome.bookmarks === undefined ? fakeChrome : window.chrome
