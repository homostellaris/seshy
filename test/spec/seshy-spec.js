var seshyFolderId;

describe("Saving sessions.", function() {

  var windowId;
  var bookmarks;
  var tabsInfo;

  beforeEach(function(done) {
    initialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(begin, 1000);

    function begin() {
      chrome.windows.create({}, function(newWindow) {
        createTabs(newWindow, done);
      });
    }
  })

  it("Should be able to save a set of tabs as bookmarks in a folder.", function(done) {
    callTest(done);
  });

  it("Should delete all the bookmarks in the session folder before saving an existing session.", function(done) {
    getSeshyFolder(createSessionBookmarksFolderThenBookmarks);

    function createSessionBookmarksFolderThenBookmarks(bookmarkTreeNodes) {
      createSessionBookmarksFolder(bookmarkTreeNodes, createBookmarks);
    }

    function createBookmarks(sessionBookmarksFolder) {
      expectedSessionFolderId = sessionBookmarksFolder.id;
      var asBookmarks = true;
      bookmarksInfo = getTabsOrBookmarksInfo(expectedSessionFolderId, asBookmarks, 2);

      chrome.bookmarks.create(bookmarksInfo[0]);
      chrome.bookmarks.create(bookmarksInfo[1]);
      chrome.bookmarks.create(bookmarksInfo[2]);
      chrome.bookmarks.create(bookmarksInfo[3], callTestWithDone);
    }

    function callTestWithDone(bookmarkTreeNode) {
      callTest(done);
    }
  });

  it("Only save sessions the user has flagged to be saved.", function() {
    console.log("Unimplemented test.");
  });

  afterEach(function(done) {
    cleanUp();
    // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
    setTimeout(done, 1000);
  });

  function createTabs(newWindow, callback, tabSetNumber) {
    windowId = newWindow.id;
    tabsInfo = getTabsOrBookmarksInfo(windowId, tabSetNumber);

    chrome.tabs.create(tabsInfo[0]);
    chrome.tabs.create(tabsInfo[1]);
    chrome.tabs.create(tabsInfo[2], callback);
  }

  function callTest(done) {
    saveSession(windowId); // Method under test.
    setTimeout(getBookmarksFolder, 1000);

    function getBookmarksFolder() {
      var query = {
        'title': 'Test Session'
      }
      chrome.bookmarks.search(query, getBookmarks);
    }

    function getBookmarks(bookmarkSessionFolderSearchResults) {
      // Only one bookmark session folder with the correct saved tabs ensures that the original bookmarks were deleted.
      expect(bookmarkSessionFolderSearchResults.length).toEqual(1);

      chrome.bookmarks.getChildren(bookmarkSessionFolderSearchResults[0].id, function(bookmarkTreeNodes) {
        bookmarks = bookmarkTreeNodes;
        assertSavedBookmarks();
      });
    }

    function assertSavedBookmarks() {
      for (var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        var expectedTabInfo = tabsInfo[i];
        expect(bookmark.index).toEqual(expectedTabInfo.index);
        expect(bookmark.url).toEqual(expectedTabInfo.url);
      }
      done();
    }
  }
});

describe("Recognising existing saved sessions.", function() {

  var expectedSessionFolderId;
  var windowToCheck;
  var bookmarksInfo;
  var actualSessionFolderId;

  beforeEach(function(done) {
    initialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(begin, 1000);

    function begin() {
      getSeshyFolder(createSessionBookmarksFolderThenBookmarks);
    }

    function createSessionBookmarksFolderThenBookmarks(bookmarkTreeNodes) {
      createSessionBookmarksFolder(bookmarkTreeNodes, createBookmarks);
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

    function callTest(uptodateWindowToCheck) {
      windowToCheck = uptodateWindowToCheck;
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
function getTabsOrBookmarksInfo(windowOrParentId, asBookmarks, tabSetNumber) {
  var tabsInfo1 = [
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
  var tabsInfo2 = [
    {
      'index': 0,
      'url': 'chrome://apps/'
    },
    {
      'index': 1,
      'url': 'chrome://downloads/'
    },
    {
      'index': 2,
      'url': 'chrome://history/'
    },
    {
      'index': 3,
      'url': 'chrome://newtab/'
    }
  ]

  if (tabSetNumber === 2) {
    var tabsInfo = tabsInfo2;
  }
  else {
    var tabsInfo = tabsInfo1;
  }

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

function createSessionBookmarksFolder(bookmarkTreeNodes, callback) {
  var seshyFolder = bookmarkTreeNodes[0];
  var options = {
    'parentId': seshyFolder.id, // From seshy.js
    'title': 'Test Session'
  }
  chrome.bookmarks.create(options, callback);
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
