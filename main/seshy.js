//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
// chrome.windows.onCreated.addListener(checkForSession);
// chrome.windows.onRemoved.addListener(saveSession);

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var seshyFolderId = undefined;

initialise()

function initialise() {
  initialiseSessionsFolder();
}

function initialiseSessionsFolder() {
  query = {
    'title': 'Seshy',
    'url': null
  }
  chrome.bookmarks.search(query, function(bookmarkTreeNodes) {
    if (bookmarkTreeNodes.length == 0) {
      createSessionsFolder();
    }
    else if (bookmarkTreeNodes.length == 1) {
      sessionsFolderId = bookmarkTreeNodes[0].id;
      message = "Seshy folder already exists with ID " + sessionsFolderId;
      console.log(message);
    }
    else {
      console.error("More than one Session folder in 'Other Bookmarks'!");
    }
  })
}

function createSessionsFolder() {
  bookmark = {
    'title': 'Seshy'
  }
  chrome.bookmarks.create(bookmark, function(seshyFolder) {
    seshyFolderId = seshyFolder.id;
    message = "Created seshy folder.";
    console.log(message);
  });
}

function log() {
  message = "A thing happened.";
  console.log(message);
}

//---===~ Session Management ~===---------------------------------------------------------------------------------------
function checkForSession() {
  console.log("Checking if tab set is a saved session.");
}

function saveSession(windowId) {
  var tabs = undefined;
  var sessionFolderId = undefined;

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
