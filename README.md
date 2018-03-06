# Seshy
A Chrome window is not always a throwaway set of tabs, sometimes it is an ongoing *session* with the same lifecycle as the task you are working on. The problem is that tasks can be easily put down and picked back up again but browsing sessions cannot. **Seshy** aims to solve that problem.

To **Seshy**, every Chrome window is a *session*. If a *session* is marked as *saved* when it becomes persistent and is stored in a bookmark folder. Tabs are stored as bookmarks in the session's bookmark folder and are updated (almost) immediately whenever something changes about them. In fact, you can view Seshy simply as an extension that maps windows to *sessions* and tabs to *bookmarks* and provides a UI for browsing and resuming them.

**Seshy 1.0** is still in development but will be coming to the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) in the next few months.

# Testing
### Running the tests.
The best way to get acquainted with Seshy development is to run the tests so that you can read the Jasmine specs that will be visible when the tests complete. Reading them will help you understand the concepts and Seshy's existing behaviour.
1. `[sudo] npm install`
2. `npm test`

### Methodology
The way the tests work is a little wacky but allow me to explain.

Jasmine for the browser is used rather than Jasmine for Node because it means that the actual Chrome APIs in the tests making them more 'live-like'.

The difficulty with this is that there is no easy way to get the test results and act upon them in order to appropriately pass or fail Travis jobs. The solution is convoluted but effective:

- Chrome Driver is used to start a Chrome instance with the test extension loaded.
- The test extension automatically navigates to the spec runner when it is loaded which runs the tests.
- DOM inspection is used from the Chrome Driver to get the test results and return an appropriate exit code.

The key here is that Chrome Driver has greater access to the host system than a browser does so it is much easier to return the exit code Travis needs.

# Contributing
_Coming soon..._
