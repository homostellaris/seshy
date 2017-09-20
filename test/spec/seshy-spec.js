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

  xit("Saves a session if it is given a name and it is not already saved.", function(done) {
    console.log("Unimplemented test.");
    done();
  })

  xit("Puts the text field for the current session's name into edit mode ready to be saved when the session manager " +
  "is opened and the current session is not already saved.", function(done) {
    console.log("Unimplemented test.");
    done();
  });

  xit("Only saves sessions the user has flagged to be saved.", function(done) {
    console.log("Unimplemented test.");
    done();
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

    var windowId;
    var sessionFolderId;
    var bookmarksInfo;

    beforeEach(function(done) {
      clearLocalStorageAndInitialise();
      // Necessary because it takes time to create Seshy folder.
      setTimeout(() => {
        chrome.windows.create({}, (newWindow) => {
          windowId = newWindow.id;
          bookmarksInfo = getTabsOrBookmarksInfo(newWindow.id, false);
          createTabs(bookmarksInfo, saveTestSessionAndCaptureSessionFolderId);
        });
      }, 1000);

      function saveTestSessionAndCaptureSessionFolderId() {
        saveTestSession(windowId, captureSessionFolderId);
      }

      function captureSessionFolderId(newSessionFolderId) {
        sessionFolderId = newSessionFolderId;
        chrome.windows.remove(windowId, () => {
          done();
        });
      }
    });

    it("Adds a window ID to session folder ID mapping in local storage.", function(done) {
      resumeSession(sessionFolderId, (newWindow) => {
        windowId = newWindow.id;
        chrome.storage.local.get(null, assertWindowToSessionFolderMappingAdded)
      });

      function assertWindowToSessionFolderMappingAdded(allLocalStorageObject) {
        var allLocalStorageKeys = Object.keys(allLocalStorageObject);

        var matchingLocalStorageKey;
        var matchingLocalStorageKeyValue;

        for (var i = 0; i < allLocalStorageKeys.length; i++) {
          var localStorageKey = allLocalStorageKeys[i];
          if (localStorageKey == windowId) {
            matchingLocalStorageKey = localStorageKey;
            matchingLocalStorageKeyValue = allLocalStorageObject[windowId.toString()]
          }
        }
        expect(matchingLocalStorageKey).toBe(windowId.toString());
        expect(matchingLocalStorageKeyValue).toBe(sessionFolderId);
        done();
      }
    });

    it("Opens a window with all the tabs as they were when the session was saved.", function(done) {
      resumeSession(sessionFolderId, (newWindow) => {
        assertSessionRestored(newWindow, bookmarksInfo);
      });

      function assertSessionRestored(newWindow, bookmarksInfo) {
        var tabs = newWindow.tabs;

        var expectedTabsNumber = bookmarksInfo.length;
        expect(tabs.length).toBe(expectedTabsNumber);

        var allTabsEqualToBookmarks = true;
        for (var i = 0; i++; i < tabs.length) {
          var tab = tabs[i];
          var bookmark = bookmarksInfo[i];
          if (tabEqualToBookmark(tab, bookmark)) {
            allTabsEqualBookmarks = false;
          }
        }
        expect(allTabsEqualToBookmarks).toBe(true);
        done();
      }
    });

    xit("Focuses the appropriate window if the session is already open.", function(done) {
      console.log("Unimplemented test.");
      done();
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

    afterEach(function(done) {
      cleanUp();
      // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
      setTimeout(done, 1000);
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

  afterEach(function(done) {
    cleanUp();
    // Necessary because it takes time to delete Seshy folder in cleanup of previous test.
    setTimeout(done, 1000);
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
  if (isFunction(callback)) {
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
  var expectedSessionFolderId;

  getSeshyFolder((seshyFolder) => {
    createSessionBookmarksFolder(seshyFolder, createBookmarksThenSaveMapping);
  });

  function createBookmarksThenSaveMapping(sessionBookmarksFolder) {
    expectedSessionFolderId = sessionBookmarksFolder.id;

    createBookmarks(sessionBookmarksFolder, () => {
      addWindowToSessionMapping(windowId, expectedSessionFolderId, returnSessionFolderId);
    })
  }

  function returnSessionFolderId() {
    callback(expectedSessionFolderId);
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

function createBookmarks(sessionBookmarksFolder, callback) {
  var asBookmarks = true;
  var sessionFolderId = sessionBookmarksFolder.id;
  var bookmarksInfo = getTabsOrBookmarksInfo(sessionFolderId, asBookmarks, 2);

  chrome.bookmarks.create(bookmarksInfo[0]);
  chrome.bookmarks.create(bookmarksInfo[1]);
  chrome.bookmarks.create(bookmarksInfo[2]);

  // TODO Properly identify if function.
  if (isFunction(callback)) {
    chrome.bookmarks.create(bookmarksInfo[3], () => {
      callback(bookmarksInfo);
    });
  }
  else {
    chrome.bookmarks.create(bookmarksInfo[3]);
  }
}

function addWindowToSessionMapping(windowId, expectedSessionFolderId, callback) {
  var items = {};
  items[windowId.toString()] = expectedSessionFolderId;
  chrome.storage.local.set(items, () => {
    callback();
  });
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
