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
  var query = 0;
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
