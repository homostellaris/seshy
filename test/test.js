alert('BYE');
chrome.tabs.getCurrent(function(tab) {
  chrome.tabs.remove(tab.id);
});
