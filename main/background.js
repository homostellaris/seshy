// chrome.tabs.onCreated.addListener(addTab)
// chrome.tabs.onUpdated.addListener(updateTab)
// chrome.tabs.onMoved.addListener(updateTab)
// chrome.tabs.onDetached.addListener(removeTab)
// chrome.tabs.onAttached.addListener(addTab)
// chrome.tabs.onRemoved.addListener(removeTab)
// chrome.tabs.onReplaced.addListener(updateTab)

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

// ---===~ Session Management ~===--------------------------------------------------------------------------------------

function addTab(tab) {
  if (tab.url == 'chrome://newtab/') {
    return;
  }
  bookmark = {
    'parentId': sessionsFolderId,
    'url': tab.url
  };
  chrome.bookmarks.create(bookmark, log);
}

function updateTab(tabId, changeInfo, tab) {
  if (tab.url == 'chrome://newtab/') {
    return;
  }
  bookmarkTreeNode = getBookmark();
  bookmark = {
    'parentId': sessionsFolderId,
    'url': tab.url
  };
  chrome.bookmarks.create(bookmark, log);
}

function getBookmark(title, url, index) {
  var query = '';
  chrome.bookmarks.search(query, function() {})
}

function createBookmark() {
  chrome.bookmarks.search
}

function removeTab() {
  console.log("Remove tab.");
}

function getExistingBookmark(tab) {
  chrome.bookmarks.search()
}
