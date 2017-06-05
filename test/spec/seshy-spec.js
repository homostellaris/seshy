var tabsInfo = [
  {
    'windowId': undefined,
    'index': 0,
    'url': 'chrome://extensions/'
  },
  {
    'windowId': undefined,
    'index': 1,
    'url': 'chrome://settings/'
  },
  {
    'windowId': undefined,
    'index': 2,
    'url': 'chrome://about/'
  },
  {
    'windowId': undefined,
    'index': 3,
    'url': 'chrome://newtab/'
  }
]

describe("saving sessions", function() {

  var windowId;
  var bookmarksFolderId;
  var bookmarks;

  beforeEach(function(done) {
    chrome.windows.create({}, function(newWindow) {
      createTabs(newWindow);
    });

    function checkBookmarksVariable() {
      return bookmarks !== 'undefined';
    }

    function createTabs(newWindow) {
      windowId = newWindow.id;
      tabsInfo[0].windowId = windowId;
      tabsInfo[1].windowId = windowId;
      tabsInfo[2].windowId = windowId;
      chrome.tabs.create(tabsInfo[0]);
      chrome.tabs.create(tabsInfo[1]);
      chrome.tabs.create(tabsInfo[2], callTest);
    }

    function callTest(tab) {
      saveSession(windowId);
      setTimeout(getBookmarksFolder, 2000);
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

  afterEach(function() {
    cleanUp();

    function cleanUp() {
      getBookmarksFolder();
    }

    function getBookmarksFolder() {
      query = {
        'title': 'Test Session'
      }
      chrome.bookmarks.search(query, removeBookmarksFolder);
    }

    function removeBookmarksFolder(bookmarkTreeNodes) {
      lastTestBookmarkFolder = bookmarkTreeNodes[bookmarkTreeNodes.length - 1];
      chrome.bookmarks.removeTree(lastTestBookmarkFolder.id, function() {
        removeWindow();
      });
    };

    function removeWindow() {
      chrome.windows.remove(windowId);
    }
  });
});

// describe("recognising sessions", function() {
//   it("should recognise when a set of opened tabs represents an existing session", function() {
//     expect(1).toEqual(1);
//   });
//
//   beforeEach(function(done) {
//     getSessionsFolder();
//
//     function getSeshyFolder() {
//       var query = {
//         'title': 'Sessions'
//       }
//       chrome.bookmarks.search(query, createSessionBookmarksFolder);
//     }
//
//     function createSessionBookmarksFolder() {
//       chrome.bookmarks.create()
//     }
//   })
// })

// alert('BYE');
// chrome.tabs.getCurrent(function(tab) {
//   chrome.tabs.remove(tab.id);
// });
