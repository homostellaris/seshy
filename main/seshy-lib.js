//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
function initialise() {
   checkIfSeshyFolderExists();
}

function checkIfSeshyFolderExists() {
  console.log("Checking for existing Seshy folder.");

  query = {
    'title': 'Seshy',
    'url': null
  };
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
  };
  chrome.bookmarks.create(bookmark, function(seshyFolder) {
    seshyFolderId = seshyFolder.id;
    message = "Created seshy folder with ID " + seshyFolderId + ".";
    console.log(message);
  });
}

//---===~ Session Management ~===---------------------------------------------------------------------------------------
function resumeSession(windowId, sessionFolderId, callback) {
  storeWindowToSessionFolderMapping(windowId, sessionFolderId, callback);
}

function getSession(windowToCheck, callback) {
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
  var sessionFolderId;

  console.log("Saving tab set into bookmarks folder.");
  chrome.windows.get(windowId, {populate: true}, checkIfExistingSavedSessionThenGetSessionFolder);

  function checkIfExistingSavedSessionThenGetSessionFolder(windowToCheck) {
    sessionWindow = windowToCheck;
    tabs = sessionWindow.tabs;
    getWindowToSessionFolderMapping(windowId, getSessionFolder);
  }

  function getSessionFolder(existingSavedSessionMapping) {
    if (typeof existingSavedSessionMapping[sessionWindow.id] != 'undefined') {
      removeBookmarksInFolder(existingSavedSessionMapping[sessionWindow.id]);
    }
    else {
      createSessionFolder(sessionWindow);
    }
  }

  function createSessionFolder(sessionWindow) {
    console.log("Creating session folder for window with ID " + sessionWindow.id + ".");

    var bookmarkInfo = {
      'parentId': seshyFolderId,
      'title': 'Test Session'
    };
    chrome.bookmarks.create(bookmarkInfo, callSaveTabsAsBookmarksWithId);

    function callSaveTabsAsBookmarksWithId(sessionFolder) {
      saveTabsAsBookmarks(sessionFolder.id);
    }
  }

  function removeBookmarksInFolder(bookmarkFolderId) {
    sessionFolderId = bookmarkFolderId;
    chrome.bookmarks.getChildren(bookmarkFolderId, removeBookmarks);
  }

  function removeBookmarks(bookmarkTreeNodes) {
    for (var i = 0; i < bookmarkTreeNodes.length; i++) {
      var bookmarkTreeNode = bookmarkTreeNodes[i];
      chrome.bookmarks.remove(bookmarkTreeNode.id);

      if (i == bookmarkTreeNodes.length - 1) {
        saveTabsAsBookmarks(sessionFolderId);
      }
    }
  }

  function saveTabsAsBookmarks(newSessionFolderId) {
    sessionFolderId = newSessionFolderId;
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];

      createProperties = {
        'parentId': sessionFolderId,
        'title': 'Tab ' + i,
        'index': tab.index,
        'url': tab.url
      };

      if (i == tabs.length - 1) {
        chrome.bookmarks.create(createProperties, callStoreWindowToSessionFolderMapping);
      }
      else {
        chrome.bookmarks.create(createProperties);
      }
    }
  }

  function callStoreWindowToSessionFolderMapping(bookmarkTreeNode) {
    storeWindowToSessionFolderMapping(sessionWindow.id, sessionFolderId);
  }
}

function getAllSessionFolders(seshyFolderId, callback) {
  chrome.bookmarks.getSubTree(seshyFolderId, returnChildren);
  function returnChildren(seshyFolderSearchResults) {
    seshyFolder = seshyFolderSearchResults[0];
    callback(seshyFolder.children);
  }
}

//---===~ Storage ~===--------------------------------------------------------------------------------------------------
function storeWindowToSessionFolderMapping(windowId, bookmarkFolderId, callback) {
  var windowToSessionFolderMapping = {};
  windowToSessionFolderMapping[windowId] = bookmarkFolderId;
  // TODO Properly identify if function.
  if (typeof callback != 'undefined') {
    chrome.storage.local.set(windowToSessionFolderMapping, callback);
  }
  else {
    chrome.storage.local.set(windowToSessionFolderMapping);
  }
}

function getWindowToSessionFolderMapping(windowId, callback) {
  chrome.storage.local.get(windowId.toString(), callback);
}

function removeWindowToSessionFolderMapping(windowId, callback) {
  chrome.storage.local.remove(windowId.toString());
  // TODO Properly identify if function.
  if (typeof callback != 'undefined') {
    callback();
  }
}
