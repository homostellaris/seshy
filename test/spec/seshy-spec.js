describe("Saving sessions.", function() {

  var windowId;
  var bookmarks;
  var tabsInfo;

  beforeEach(function(done) {
    clearLocalStorageAndInitialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(() => {
      chrome.windows.create({}, (newWindow) => {
        windowId = newWindow.id
        tabsInfo = getTabsOrBookmarksInfo(newWindow.id, false);
        createTabs(tabsInfo, done);
      });
    }, 1000);
  });

  it("Should be able to save a set of tabs as bookmarks in a folder.", function(done) {
    callTest(done);
  });

  it("Should delete all the bookmarks in the session folder before saving an existing session.", function(done) {
    saveTestSession(windowId, () => {
      callTest(done);
    });
  });

  it("Only save sessions the user has flagged to be saved.", function() {
    console.log("Unimplemented test.");
  });

  afterEach(function(done) {
    cleanUp();
    // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
    setTimeout(done, 1000);
  });

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
        assertSavedBookmarks(bookmarks, tabsInfo);
      });
    }

    function assertSavedBookmarks(bookmarks, expectedTabsInfo) {
      for (var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        var expectedTabInfo = expectedTabsInfo[i];
        expect(bookmark.index).toEqual(expectedTabInfo.index);
        expect(bookmark.url).toEqual(expectedTabInfo.url);
      }
      done();
    }
  }
});

describe("Resuming sessions.", function() {

  describe("User restores a session from the session manager.", function() {

    beforeEach(function(done) {
      clearLocalStorageAndInitialise();
      // Necessary because it takes time to create Seshy folder.
      setTimeout(done, 1000);
    });

    it("Adds a window id to session folder id mapping in local storage.", function(done) {
      var fakeWindowId = 72;
      var fakeSessionFolderId = 69;

      chrome.storage.local.clear(resumeSession);

      resumeSession(fakeWindowId, fakeSessionFolderId, () => {
        getAllLocalStorage(assertWindowToSessionFolderMappingAdded);
      });

      function assertWindowToSessionFolderMappingAdded(allLocalStorageObject) {
        var allLocalStorageKeys = Object.keys(allLocalStorageObject);

        var matchingLocalStorageKey;
        var matchingLocalStorageKeyValue;

        for (var i = 0; i < allLocalStorageKeys.length; i++) {
          var localStorageKey = allLocalStorageKeys[i];
          if (localStorageKey == fakeWindowId) {
            matchingLocalStorageKey = allLocalStorageKeys[i];
            matchingLocalStorageKeyValue = allLocalStorageObject[fakeWindowId.toString()]
          }
        }
        expect(matchingLocalStorageKey).toBe(fakeWindowId.toString());
        expect(matchingLocalStorageKeyValue).toBe(fakeSessionFolderId);
        done();
      }
    });

    it("Opens a window with all the tabs as they were when the session was saved.", function() {
      console.log("Unimplemented test.");
    });

    afterEach(function(done) {
      cleanUp();
      // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
      setTimeout(done, 1000);
    });
  })

  describe("Identifying existing session and prompting to resume.", function() {

    // TODO set variables on `this` instead.
    var expectedSessionFolderId;
    var windowToCheck;
    var bookmarksInfo;
    var actualSessionFolderId;

    beforeEach(function(done) {
      clearLocalStorageAndInitialise();
      // Necessary because it takes time to create Seshy folder.
      setTimeout(() => {
        getSeshyFolder(createSessionBookmarksFolderThenBookmarks);
      }, 1000);

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
        getSession(windowToCheck, captureExistingSession); // Method under test.
      }

      function captureExistingSession(actualSessionFolder) {
        actualSessionFolderId = actualSessionFolder === null ? null : actualSessionFolder.id;
        done();
      }
    });

    afterEach(function() {
      cleanUp();
    });

    it("Should recognise when a set of opened tabs represents an existing session.", function() {
      expect(expectedSessionFolderId).toEqual(actualSessionFolderId);
    });
  });
});

describe("Ending sessions.", function() {

  var windowId;

  beforeEach(function(done) {
    clearLocalStorageAndInitialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(() => {
      chrome.windows.create({}, addWindowToSessionMapping);
    }, 1000);

    function addWindowToSessionMapping(newWindow) {
      windowId = newWindow.id;
      var fakeSessionFolderId = 1;
      var items = {};
      items[newWindow.id.toString()] = fakeSessionFolderId;
      chrome.storage.local.set(items, done);
    }
  });

  it("Removes any window to session folder mapping from local storage.", function(done) {
    removeWindowToSessionFolderMapping(windowId, () => {
      getAllLocalStorage(assertWindowToSessionFolderMappingRemoved);
    });

    function assertWindowToSessionFolderMappingRemoved(allLocalStorageObject) {
      var allLocalStorageKeys = Object.keys(allLocalStorageObject);

      var matchingLocalStorageKey = false;
      var windowIdString = windowId.toString();

      for (var i = 0; i < allLocalStorageKeys.length; i++) {
        var localStorageKey = allLocalStorageKeys[i];
        if (localStorageKey == windowIdString) {
          matchingLocalStorageKey = true;
        }
      }
      expect(matchingLocalStorageKey).toBe(false);
      done();
    }
  });

  afterEach(function() {
    cleanUp();
  });
});

describe("Deleting sessions.", function() {

  var windowId;
  var expectedDeletedSessionFolderId;

  beforeEach(function(done) {
    clearLocalStorageAndInitialise();
    // Necessary because it takes time to create Seshy folder.
    setTimeout(() => {
      chrome.windows.create({}, (newWindow) => {
        windowId = newWindow.id;
        tabsInfo = getTabsOrBookmarksInfo(newWindow.id, false);
        createTabs(tabsInfo, saveTestSessionAndCaptureSessionFolderId);
      });
    }, 1000);

    function saveTestSessionAndCaptureSessionFolderId() {
      saveTestSession(windowId, captureSessionFolderId);

      function captureSessionFolderId(sessionFolderId) {
        expectedDeletedSessionFolderId = sessionFolderId;
        done();
      }
    }
  });

  it("Deletes the session folder.", function(done) {
    deleteSession(expectedDeletedSessionFolderId, tryGetSessionFolder); // Method under test.

    function tryGetSessionFolder(sessionFolderId) {
      chrome.bookmarks.get(sessionFolderId.toString(), assertSessionFolderDeleted);
      var sessionFolderDeleted = false;

      function assertSessionFolderDeleted(sessionFolderId) {
        if (chrome.runtime.lastError) {
          sessionFolderDeleted = true;
        }
        expect(sessionFolderDeleted).toBe(true);
        done();
      }
    }
  })

  afterEach(function(done) {
    cleanUp();
    // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
    setTimeout(done, 1000);
  });
});

//---===~ Functions ~===------------------------------------------------------------------------------------------------
function createTabs(tabsInfo, callback) {
  chrome.tabs.create(tabsInfo[0]);
  chrome.tabs.create(tabsInfo[1]);
  if (typeof callback != 'undefined') {
    chrome.tabs.create(tabsInfo[2], callback);
  }
  else {
    chrome.tabs.create(tabsInfo[2]);
  }
}

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

function saveTestSession(windowId, callback) {
  getSeshyFolder((seshyFolder) => {
    createSessionBookmarksFolder(seshyFolder, createBookmarks);
  });

  function createBookmarks(sessionBookmarksFolder) {
    var expectedSessionFolderId = sessionBookmarksFolder.id;
    var asBookmarks = true;
    bookmarksInfo = getTabsOrBookmarksInfo(expectedSessionFolderId, asBookmarks, 2);

    chrome.bookmarks.create(bookmarksInfo[0]);
    chrome.bookmarks.create(bookmarksInfo[1]);
    chrome.bookmarks.create(bookmarksInfo[2]);
    chrome.bookmarks.create(bookmarksInfo[3], addWindowToSessionMapping);

    // Nested function so can reference expectedSessionFolderId.
    function addWindowToSessionMapping() {
      var items = {};
      items[windowId.toString()] = expectedSessionFolderId;
      chrome.storage.local.set(items, () => {
        callback(expectedSessionFolderId);
      });
    }
  }
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

function clearLocalStorageAndInitialise() {
  chrome.storage.local.clear(initialise);
}

function getAllLocalStorage(callback) {
  chrome.storage.local.get(null, callback);
}
