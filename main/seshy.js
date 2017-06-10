//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
// chrome.windows.onCreated.addListener(checkForSession);
// chrome.windows.onRemoved.addListener(saveSession);

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var seshyFolderId;

initialise()

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
  var windowToCheck = windowToCheck;
  var callback = callback;
  var tabs = windowToCheck.tabs;

  getAllSessionFolders(seshyFolderId, compareWindowWithSessionFolders);

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

    callback(matchingSessionFolder);
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
  var sessionFolderId;

  console.log("Saving tab set into bookmarks folder.");
  chrome.windows.get(windowId, {'populate': true}, createSessionFolder);

  function createSessionFolder(currentWindow) {
    tabs = currentWindow.tabs;

    chrome.bookmarks.create({
      'parentId': seshyFolderId,
      'title': 'Test Session'
    }, saveTabsAsBookmarks)
  }

  function saveTabsAsBookmarks(newSessionFolder) {
    sessionFolderId = newSessionFolder.id;

    for (var i = 0; i < tabs.length; i++) {
      tab = tabs[i];

      createProperties = {
        'parentId': newSessionFolder.id,
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
