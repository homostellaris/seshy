//---===~ Add listeners. ~===-------------------------------------------------------------------------------------------
// chrome.windows.onCreated.addListener(checkForSession);
// chrome.windows.onRemoved.addListener(saveSession);

//---===~ Initialisation ~===-------------------------------------------------------------------------------------------
var sessionsFolderId = undefined;

initialise()
// test()

function test() {
  alert('BYE');
  chrome.tabs.query({}, function(tabs) {
    chrome.tabs.remove(tabs[0].id);
  });
}

function initialise() {
  initialiseSessionsFolder();
}

function createSessionsFolder() {
  bookmark = {
    'title': 'Sessions'
  }
  chrome.bookmarks.create(bookmark, function(sessionsFolder) {
    sessionsFolderId = sessionsFolder.id;
    message = "Created sessions folder.";
    console.log(message);
  });
}

function initialiseSessionsFolder() {
  query = {
    'title': 'Sessions',
    'url': null
  }
  chrome.bookmarks.search(query, function(bookmarkTreeNodes) {
    if (bookmarkTreeNodes.length == 0) {
      createSessionsFolder();
    }
    else if (bookmarkTreeNodes.length == 1) {
      sessionsFolderId = bookmarkTreeNodes[0].id;
      message = "Sessions folder already exists with ID " + sessionsFolderId;
      console.log(message);
    }
    else {
      console.error("More than one Session folder in 'Other Bookmarks'!");
    }
  })
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
      'title': 'Test Session'
    }, saveTabsAsBookmarks)
  }

  function saveTabsAsBookmarks(newFolder) {
    sessionFolderId = newFolder.id;

    for (var i = 0; i < tabs.length; i++) {
      tab = tabs[i];

      createProperties = {
        'parentId': newFolder.id,
        'title': 'Tab ' + i,
        'index': tab.index,
        'url': tab.url
      }
      chrome.bookmarks.create(createProperties);
    }
  }
}
