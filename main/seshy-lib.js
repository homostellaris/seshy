//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
function initialise() {
   checkIfSeshyFolderExists();
}

function checkIfSeshyFolderExists() {
  console.log("Checking for existing Seshy folder.");

  query = {
    'title': 'Seshy',
    'url': null
  }
  chrome.bookmarks.search(query, function(bookmarkTreeNodes) {
    if (bookmarkTreeNodes.length == 0) {
      console.log("No existing Seshy folder, creating...");
      createSeshyFolder();
    }
    else if (bookmarkTreeNodes.length == 1) {
      seshyFolderId = bookmarkTreeNodes[0].id;
      console.log("Seshy folder already exists with ID " + seshyFolderId + ".");
    }
    else {
      console.error("More than one Session folder in 'Other Bookmarks'!");
    }
  })
}

function createSeshyFolder() {
  bookmark = {
    'title': 'Seshy'
  }
  chrome.bookmarks.create(bookmark, function(seshyFolder) {
    seshyFolderId = seshyFolder.id;
    message = "Created seshy folder with ID " + seshyFolderId + ".";
    console.log(message);
  });
}

function log() {
  message = "A thing happened.";
  console.log(message);
}

//---===~ Session Management ~===---------------------------------------------------------------------------------------
function checkIfExistingSession(windowToCheck, callback) {
  console.log("Checking if tab set is a saved session.");

  var tabs;

  // chrome.windows.get(windowToCheckId, {'populate': true}, getTabs);
  getTabs(windowToCheck);

  function getTabs(windowToCheck) {
    if (windowToCheck.tabs) {
      tabs = windowToCheck.tabs;
      getAllSessionFolders(seshyFolderId, compareWindowWithSessionFolders);
    }
    else {
      chrome.tabs.getAllInWindow(windowToCheck.id, function(windowToCheckTabs) {
        tabs = windowToCheckTabs;
        getAllSessionFolders(seshyFolderId, compareWindowWithSessionFolders);
      })
    }
  }

  function compareWindowWithSessionFolders(sessionFolders) {
    var matchingSessionFolder = null;

    for (var i = 0; i < sessionFolders.length; i++) {
      var sessionFolder = sessionFolders[i];
      var match = compareTabsToBookmarks(tabs, sessionFolder.children);
      if (match === true) {
        matchingSessionFolder = sessionFolder;
        break;
      }
    }

    if (matchingSessionFolder === null) {
      console.log("No existing session found for window with ID " + windowToCheck.id + ".");
    }
    else {
      console.log("Existing session found in bookmark folder with ID " + matchingSessionFolder.id
      + " for window with ID " + windowToCheck.id + ".");
    }

    // TODO Properly identify if function.
    if (typeof callback != 'undefined') {
      callback(matchingSessionFolder);
    }
  }

  function compareTabsToBookmarks(tabs, bookmarks) {
    if (tabs.length != bookmarks.length) {
      return false;
    }

    for (var i = 0; i < tabs.length && i < bookmarks.length; i++) {
      var tab = tabs[i];
      var bookmark = bookmarks[i];

      if (tab.index != bookmark.index) {
        return false;
      }
      if (tab.url != bookmark.url) {
        return false;
      }
    }
    return true;
  }
}

function saveSession(windowId) {
  var tabs;
  var sessionWindow;

  console.log("Saving tab set into bookmarks folder.");
  chrome.windows.get(windowId, {populate: true}, checkIfExistingSessionThenGetSessionFolder);

  function checkIfExistingSessionThenGetSessionFolder(windowToCheck) {
    sessionWindow = windowToCheck;
    tabs = sessionWindow.tabs;
    checkIfExistingSession(windowToCheck, getSessionFolder);
  }

  function getSessionFolder(existingSessionFolder) {
    if (existingSessionFolder === null) {
      createSessionFolder(sessionWindow);
    }
    else {
      saveTabsAsBookmarks(existingSessionFolder);
    }
  }

  function createSessionFolder(sessionWindow) {
    console.log("Creating session folder for window with ID " + sessionWindow.id + ".");
    var bookmarkInfo = {
      'parentId': seshyFolderId,
      'title': 'Test Session'
    }
    chrome.bookmarks.create(bookmarkInfo, saveTabsAsBookmarks)
  }

  function saveTabsAsBookmarks(sessionFolder) {
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];

      createProperties = {
        'parentId': sessionFolder.id,
        'title': 'Tab ' + i,
        'index': tab.index,
        'url': tab.url
      }
      chrome.bookmarks.create(createProperties);
    }
  }
}

function getAllSessionFolders(seshyFolderId, callback) {
  chrome.bookmarks.getSubTree(seshyFolderId, returnChildren);
  function returnChildren(seshyFolderSearchResults) {
    seshyFolder = seshyFolderSearchResults[0];
    callback(seshyFolder.children);
  }
}
