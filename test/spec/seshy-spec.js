describe("saving sessions", function() {

  var windowId;
  var bookmarksFolderId;
  var bookmarks;
  var tabsInfo;

  beforeEach(function(done) {
    chrome.windows.create({}, function(newWindow) {
      createTabs(newWindow);
    });

    function checkBookmarksVariable() {
      return bookmarks !== 'undefined';
    }

    function createTabs(newWindow) {
      windowId = newWindow.id;
      tabsInfo = getTabsOrBookmarksInfo(windowId);

      chrome.tabs.create(tabsInfo[0]);
      chrome.tabs.create(tabsInfo[1]);
      chrome.tabs.create(tabsInfo[2], callTest);
    }

    function callTest(tab) {
      saveSession(windowId); // Method under test.
      setTimeout(getBookmarksFolder, 1000);
    }

    function getBookmarksFolder() {
      var query = {
        'title': 'Test Session'
      }
      chrome.bookmarks.search(query, getBookmarks);
    }

    function getBookmarks(bookmarkTreeNodes) {
      chrome.bookmarks.getChildren(bookmarkTreeNodes[0].id, function(bookmarkTreeNodes){
        bookmarks = bookmarkTreeNodes;
        done();
      });
    }
  })

  it("should be able to save a set of tabs as bookmarks in a folder", function() {
    for (var i = 0; i < bookmarks.length; i++) {
      var bookmark = bookmarks[i];
      var expectedTabInfo = tabsInfo[i];
      expect(bookmark.index).toEqual(expectedTabInfo.index);
      expect(bookmark.url).toEqual(expectedTabInfo.url);
    }
  });

  afterEach(function(done) {
    cleanUp();
    // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
    setTimeout(done, 1000);
  });
});

describe("recognising sessions", function() {

  var seshyFolder;
  var expectedSessionFolderId;
  var windowToCheck;
  var bookmarksInfo;
  var actualSessionFolderId;

  beforeEach(function(done) {
    initialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(begin, 1000);

    function begin() {
      getSeshyFolder(createSessionBookmarksFolder);
    }

    function createSessionBookmarksFolder(bookmarkTreeNodes) {
      seshyFolder = bookmarkTreeNodes[0];
      var options = {
        'parentId': seshyFolderId, // From seshy.js
        'title': 'Test Session'
      }
      chrome.bookmarks.create(options, createBookmarks);
    }

    function createBookmarks(sessionBookmarksFolder) {
      expectedSessionFolderId = sessionBookmarksFolder.id;
      var asBookmarks = true;
      bookmarksInfo = getTabsOrBookmarksInfo(expectedSessionFolderId, asBookmarks);

      chrome.bookmarks.create(bookmarksInfo[0]);
      chrome.bookmarks.create(bookmarksInfo[1]);
      chrome.bookmarks.create(bookmarksInfo[2]);
      chrome.bookmarks.create(bookmarksInfo[3], createWindow);
    }

    function createWindow(bookmarkTreeNode) {
      chrome.windows.create({}, createTabs);
    }

    function createTabs(newWindow) {
      windowToCheck = newWindow;
      var tabsInfo = getTabsOrBookmarksInfo(windowToCheck.id);

      chrome.tabs.create(tabsInfo[0]);
      chrome.tabs.create(tabsInfo[1]);
      chrome.tabs.create(tabsInfo[2], getWindow);
      // Don't create new tab as the new window creates that for us.
    }

    function getWindow() {
      chrome.windows.get(windowToCheck.id, {'populate': true}, callTest);
    }

    function callTest(windowToCheck) {
      windowToCheck = windowToCheck;
      checkIfExistingSession(windowToCheck, captureExistingSession); // Method under test.
    }

    function captureExistingSession(actualSessionFolder) {
      actualSessionFolderId = actualSessionFolder === null ? null : actualSessionFolder.id;
      done();
    }
  });

  it("should recognise when a set of opened tabs represents an existing session", function() {
    expect(expectedSessionFolderId).toEqual(actualSessionFolderId);
  });

  afterEach(function() {
    cleanUp();
  });
})

//---===~ Functions ~===------------------------------------------------------------------------------------------------
function getTabsOrBookmarksInfo(windowOrParentId, asBookmarks) {
  var tabsInfo = [
    {
      'index': 0,
      'url': 'chrome://extensions/'
    },
    {
      'index': 1,
      'url': 'chrome://settings/'
    },
    {
      'index': 2,
      'url': 'chrome://about/'
    },
    {
      'index': 3,
      'url': 'chrome://newtab/'
    }
  ]
  for (var i = 0; i < tabsInfo.length; i++) {
    var tabInfo = tabsInfo[i];
    if (asBookmarks === true) {
      tabInfo.parentId = windowOrParentId;
    }
    else {
      tabInfo.windowId = windowOrParentId;
    }
  }
  return tabsInfo;
}

function cleanUp() {
  getSeshyFolder(removeBookmarksFolder);
}

function getSeshyFolder(callback) {
  var query = {
    'title': 'Seshy'
  }
  chrome.bookmarks.search(query, callback);
}

function getBookmarksFolder() {
  query = {
    'title': 'Test Session'
  }
  chrome.bookmarks.search(query, removeBookmarksFolder);
}

function removeBookmarksFolder(bookmarkTreeNodes) {
  bookmarksFolder = bookmarkTreeNodes[0];
  chrome.bookmarks.removeTree(bookmarksFolder.id, getAllWindows);
}

function getAllWindows() {
  chrome.windows.getAll({}, removeWindows);
}

function removeWindows(windows) {
  // Don't remove first window because it will have Jasmine test results.
  for (var i = 1; i < windows.length; i++) {
    var window = windows[i];
    chrome.windows.remove(window.id);
  }
}

// alert('BYE');
// chrome.tabs.getCurrent(function(tab) {
//   chrome.tabs.remove(tab.id);
// });
